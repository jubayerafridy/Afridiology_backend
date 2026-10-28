import { prisma } from "../../../config/prisma.js";

import { getBookmarkStates } from "../bookmark/bookmark.service.js";
import { getQuestionProgressStates } from "../questionProgress/questionProgress.service.js";

import type { BookmarkCollectionData, BookmarkState } from "../bookmark/bookmark.types.js";
import { hasActiveChapter, hasActiveQuestionPaper } from "../studentContentAccess.service.js";

export type ChapterMCQLanguage = "bangla" | "english";

type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

interface PersonalizedTarget {
  targetType: "MCQ";
  targetId: string;
}

function isKnowledgeLinkType(value: string | null): value is KnowledgeLinkType {
  return value === "CHAPTER" || value === "LESSON" || value === "CONCEPT" || value === "EXECUTION";
}

function buildBookmarkCollectionData(
  collections: Array<{
    id: string;
    name: string;
    color: string;
    type: string;
    defaultType: string | null;
    sortOrder: number;
  }>,
): BookmarkCollectionData[] {
  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    color: collection.color,
    type: collection.type as BookmarkCollectionData["type"],
    defaultType: collection.defaultType as BookmarkCollectionData["defaultType"],
    sortOrder: collection.sortOrder,
  }));
}

export async function getChapterMCQs(chapterId: string, language: ChapterMCQLanguage = "bangla", userId?: string) {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
    isActive: true,
  });

  if (!chapter) {
    return null;
  }

  if (!await hasActiveChapter(chapterId)) return null;

  const hierarchyTargets = new Set<string>([`CHAPTER:${chapterId}`]);

  const lessons = await prisma.orm.public.Lesson.where({
    chapterId,
    isActive: true,
  }).all();

  for (const lesson of lessons) {
    hierarchyTargets.add(`LESSON:${lesson.id}`);

    const concepts = await prisma.orm.public.Concept.where({
      lessonId: lesson.id,
      isActive: true,
    }).all();

    for (const concept of concepts) {
      hierarchyTargets.add(`CONCEPT:${concept.id}`);

      const executions = await prisma.orm.public.Execution.where({
        conceptId: concept.id,
        isActive: true,
      }).all();

      for (const execution of executions) {
        hierarchyTargets.add(`EXECUTION:${execution.id}`);
      }
    }
  }

  const mcqRecords = await prisma.orm.public.MCQ.where({
    isActive: true,
  }).all();

  const matchedMCQs: Array<{
    mcq: (typeof mcqRecords)[number];
    questionPaper: NonNullable<Awaited<ReturnType<typeof prisma.orm.public.QuestionPaper.first>>>;
  }> = [];

  for (const mcq of mcqRecords) {
    if (mcq.linkId === null || !isKnowledgeLinkType(mcq.linkType)) {
      continue;
    }

    const targetKey = `${mcq.linkType}:${mcq.linkId}`;

    if (!hierarchyTargets.has(targetKey)) {
      continue;
    }

    const questionPaper = await prisma.orm.public.QuestionPaper.first({
      id: mcq.questionPaperId,
    });

    if (!questionPaper || !questionPaper.isActive || !await hasActiveQuestionPaper(questionPaper.id)) {
      continue;
    }

    matchedMCQs.push({
      mcq,
      questionPaper,
    });
  }

  matchedMCQs.sort((a, b) => {
    const aNo = Number(a.mcq.qusNo);
    const bNo = Number(b.mcq.qusNo);

    if (Number.isFinite(aNo) && Number.isFinite(bNo)) {
      return aNo - bNo;
    }

    return String(a.mcq.qusNo).localeCompare(String(b.mcq.qusNo));
  });

  const questions = matchedMCQs.map(({ mcq, questionPaper }) => ({
    id: mcq.id,
    qusNo: mcq.qusNo,
    questionPaperId: mcq.questionPaperId,

    description: language === "english" ? mcq.descriptionEng : mcq.descriptionBN,

    stimulus: null,

    options: language === "english" ? mcq.optionsEng : mcq.optionsBN,

    imageUrl: mcq.imageUrl,

    link: {
      type: mcq.linkType,
      id: mcq.linkId,
    },

    source: {
      type: questionPaper.source,
      board: questionPaper.board,
      institution: questionPaper.institution,
      year: questionPaper.year,
      paperId: questionPaper.id,
    },
  }));

  let bookmarkCollections: BookmarkCollectionData[] | undefined;

  if (userId !== undefined && questions.length > 0) {
    const collections = await prisma.orm.public.BookmarkCollection.where({
      userId,
    })
      .orderBy((collection) => collection.sortOrder.asc())
      .all();

    if (collections.length > 0) {
      bookmarkCollections = buildBookmarkCollectionData(collections);
    }

    const targets: PersonalizedTarget[] = questions.map((question) => ({
      targetType: "MCQ",
      targetId: question.id,
    }));

    const [bookmarkStates, progressStates] = await Promise.all([getBookmarkStates(userId, targets), getQuestionProgressStates(userId, targets)]);

    for (const question of questions) {
      const key = `MCQ:${question.id}`;

      const bookmarkState = bookmarkStates.get(key);
      const progressState = progressStates.get(key);

      Object.assign(question, {
        bookmark: {
          bookmarked: bookmarkState?.bookmarked ?? false,
          bookmarkId: bookmarkState?.bookmarkId ?? "",
          starRating: bookmarkState?.starRating ?? 0,
          collectionIds: bookmarkState?.collectionIds ?? [],
          progress: {
            status: progressState?.status ?? "NOT_STARTED",
          },
        } satisfies BookmarkState,
      });
    }
  }

  const result: {
    chapter: {
      id: string;
      chapterNo: number;
      name: string;
    };
    questions: typeof questions;
    bookmarkCollections?: BookmarkCollectionData[];
  } = {
    chapter: {
      id: chapter.id,
      chapterNo: chapter.chapterNo,
      name: language === "bangla" ? chapter.nameBN : chapter.nameEng,
    },
    questions,
  };

  if (bookmarkCollections !== undefined) {
    result.bookmarkCollections = bookmarkCollections;
  }

  return result;
}

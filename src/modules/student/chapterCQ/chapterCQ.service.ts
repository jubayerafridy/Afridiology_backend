import { prisma } from "../../../config/prisma.js";

import { getBookmarkStates } from "../bookmark/bookmark.service.js";
import { getQuestionProgressStates } from "../questionProgress/questionProgress.service.js";

import type { BookmarkCollectionData, BookmarkState } from "../bookmark/bookmark.types.js";

export type ChapterCQLanguage = "bangla" | "english";

type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

type PersonalizedTarget = {
  targetType: "CQ";
  targetId: string;
};

type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

type ChapterCQItem = {
  id: string;
  qusNo: number | null;
  questionPaperId: string;
  language: ChapterCQLanguage;
  description: unknown;
  stimulus: string | null;
  questions: {
    a: string;
    b: string;
    c: string;
    d: string | null;
  };
  imageUrl: string | null;
  ytLink: string | null;
  source: {
    type: string;
    board: string | null;
    institution: string | null;
    year: number | null;
    paperId: string;
  };
  bookmark?: BookmarkState;
};

export interface ChapterCQData {
  chapter: {
    id: string;
    chapterNo: number;
    nameBN: string;
    nameEng: string;
  };
  questions: ChapterCQItem[];
  bookmarkCollections?: BookmarkCollectionData[];
}

function isKnowledgeLinkType(value: string | null): value is KnowledgeLinkType {
  return value === "CHAPTER" || value === "LESSON" || value === "CONCEPT" || value === "EXECUTION";
}

function getGraphId(type: KnowledgeLinkType, id: string): string {
  switch (type) {
    case "CHAPTER":
      return `chapter-${id}`;
    case "LESSON":
      return `lesson-${id}`;
    case "CONCEPT":
      return `concept-${id}`;
    case "EXECUTION":
      return `math-${id}`;
  }
}

function getCQMappings(cq: {
  quesKaLinkType: string | null;
  quesKaLinkId: string | null;
  quesKhaLinkType: string | null;
  quesKhaLinkId: string | null;
  quesGaLinkType: string | null;
  quesGaLinkId: string | null;
  quesGhaLinkType: string | null;
  quesGhaLinkId: string | null;
}): Array<{ type: KnowledgeLinkType; id: string }> {
  const links = [
    { type: cq.quesKaLinkType, id: cq.quesKaLinkId },
    { type: cq.quesKhaLinkType, id: cq.quesKhaLinkId },
    { type: cq.quesGaLinkType, id: cq.quesGaLinkId },
    { type: cq.quesGhaLinkType, id: cq.quesGhaLinkId },
  ];

  const mappings: Array<{ type: KnowledgeLinkType; id: string }> = [];

  for (const link of links) {
    if (link.id !== null && isKnowledgeLinkType(link.type)) {
      mappings.push({
        type: link.type,
        id: link.id,
      });
    }
  }

  return mappings;
}

function getLocalizedDescription(descriptionBN: unknown, descriptionEng: unknown, language: ChapterCQLanguage): unknown {
  return language === "bangla" ? descriptionBN : descriptionEng;
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

function applyPersonalization(questions: ChapterCQItem[], bookmarkStates: Map<string, BookmarkState>, progressStates: Map<string, { status: ProgressStatus }>): void {
  for (const question of questions) {
    const key = `CQ:${question.id}`;
    const bookmark = bookmarkStates.get(key);
    const progress = progressStates.get(key);

    question.bookmark = {
      bookmarked: bookmark?.bookmarked ?? false,
      bookmarkId: bookmark?.bookmarkId ?? "",
      starRating: bookmark?.starRating ?? 0,
      collectionIds: bookmark?.collectionIds ?? [],
      progress: {
        status: progress?.status ?? "NOT_STARTED",
      },
    };
  }
}

export async function getChapterCQs(chapterId: string, language: ChapterCQLanguage = "bangla", userId?: string): Promise<ChapterCQData | null> {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    return null;
  }

  // Match the Knowledge Graph's chapter hierarchy.
  const hierarchyIds = new Set<string>();

  hierarchyIds.add(`chapter-${chapter.id}`);

  const lessons = await prisma.orm.public.Lesson.where({
    chapterId,
    isActive: true,
  }).all();

  for (const lesson of lessons) {
    hierarchyIds.add(`lesson-${lesson.id}`);

    const concepts = await prisma.orm.public.Concept.where({
      lessonId: lesson.id,
      isActive: true,
    }).all();

    for (const concept of concepts) {
      hierarchyIds.add(`concept-${concept.id}`);

      const executions = await prisma.orm.public.Execution.where({
        conceptId: concept.id,
        isActive: true,
      }).all();

      for (const execution of executions) {
        hierarchyIds.add(`math-${execution.id}`);
      }
    }
  }

  const cqRecords = await prisma.orm.public.CQ.where({
    isActive: true,
  }).all();

  const matchedCQs: Array<{
    cq: (typeof cqRecords)[number];
    paper: NonNullable<Awaited<ReturnType<typeof prisma.orm.public.QuestionPaper.first>>>;
  }> = [];

  for (const cq of cqRecords) {
    const mappings = getCQMappings(cq);

    const belongsToChapter = mappings.some((mapping) => hierarchyIds.has(getGraphId(mapping.type, mapping.id)));

    if (!belongsToChapter) {
      continue;
    }

    const paper = await prisma.orm.public.QuestionPaper.first({
      id: cq.questionPaperId,
    });

    if (!paper || !paper.isActive || paper.questionType !== "CQ") {
      continue;
    }

    matchedCQs.push({ cq, paper });
  }

  matchedCQs.sort((a, b) => {
    const aNo = a.cq.qusNo;
    const bNo = b.cq.qusNo;

    if (aNo == null && bNo != null) return 1;
    if (aNo != null && bNo == null) return -1;
    if (aNo == null && bNo == null) {
      return a.cq.id.localeCompare(b.cq.id);
    }

    return aNo! - bNo!;
  });

  const questions: ChapterCQItem[] = matchedCQs.map(({ cq, paper }) => ({
    id: cq.id,
    qusNo: cq.qusNo,
    questionPaperId: paper.id,
    language,
    description: getLocalizedDescription(cq.descriptionBN, cq.descriptionEng, language),
    stimulus: cq.quesUddipok,
    questions: {
      a: language === "bangla" ? cq.quesKaBN : cq.quesKaEng,
      b: language === "bangla" ? cq.quesKhaBN : cq.quesKhaEng,
      c: language === "bangla" ? cq.quesGaBN : cq.quesGaEng,
      d: (language === "bangla" ? cq.quesGhaBN : cq.quesGhaEng) ?? null,
    },
    imageUrl: cq.imageUrl,
    ytLink: cq.ytLink,
    source: {
      type: paper.source,
      board: paper.board,
      institution: paper.institution,
      year: paper.year,
      paperId: paper.id,
    },
  }));

  let bookmarkCollections: BookmarkCollectionData[] | undefined;

  if (userId !== undefined) {
    const collections = await prisma.orm.public.BookmarkCollection.where({
      userId,
    })
      .orderBy((collection) => collection.sortOrder.asc())
      .all();

    if (collections.length > 0) {
      bookmarkCollections = buildBookmarkCollectionData(collections);
    }

    const targets: PersonalizedTarget[] = questions.map((question) => ({
      targetType: "CQ",
      targetId: question.id,
    }));

    if (targets.length > 0) {
      const [bookmarkStates, progressStates] = await Promise.all([getBookmarkStates(userId, targets), getQuestionProgressStates(userId, targets)]);

      applyPersonalization(questions, bookmarkStates, progressStates);
    }
  }

  const result: ChapterCQData = {
    chapter: {
      id: chapter.id,
      chapterNo: chapter.chapterNo,
      nameBN: chapter.nameBN,
      nameEng: chapter.nameEng,
    },
    questions,
  };

  if (bookmarkCollections !== undefined) {
    result.bookmarkCollections = bookmarkCollections;
  }

  return result;
}

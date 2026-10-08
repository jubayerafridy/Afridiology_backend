import { prisma } from "../../../config/prisma.js";

import { getBookmarkStates } from "../bookmark/bookmark.service.js";

import { getQuestionProgressStates } from "../questionProgress/questionProgress.service.js";

import type {
  BookmarkCollectionData,
  BookmarkState,
} from "../bookmark/bookmark.types.js";

/*

 * ==================================================

 * TYPES

 * ==================================================

 */

type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

type KnowledgeItemType =
  | "chapter"
  | "lesson"
  | "concept"
  | "math"
  | "cq"
  | "mcq";

type QuestionSource =
  | "board"
  | "test-paper"
  | "model-test"
  | "game"
  | "quiz"
  | "extra";

interface KnowledgeGraphItem {
  id: string;

  type: KnowledgeItemType;

  title: string;

  slug: string;

  /*

   * JSON content document.

   *

   * The Prisma ORM exposes JSON fields through its own

   * generated JSON type. We intentionally keep the public

   * service response type as unknown so the exact JSON

   * document is passed through without changing it or

   * fighting the generated ORM type.

   */

  description?: unknown;

  descriptionBN?: unknown;

  descriptionEng?: unknown;

  parentId?: string;

  side?: "left" | "right";

  /*

   * Personalization package is intentionally optional.

   *

   * It is only added for:

   * - concept

   * - math / execution

   * - cq

   * - mcq

   *

   * Chapter and lesson NEVER receive this field.

   *

   * For supported item types, the package contains both

   * bookmark information and QuestionProgress state.

   *

   * The bookmark package is returned even when the item

   * has no Bookmark row, because progress is independent

   * from bookmarking.

   */

  bookmark?: BookmarkState;

  questionMeta?: {
    sourceType: QuestionSource;

    board?: string;

    institution?: string;

    year?: number;

    paperId?: string;
  };
}

interface KnowledgeGraphRelation {
  id: string;

  source: string;

  target: string;

  type: "contains" | "question";
}

export interface KnowledgeGraphData {
  chapter: {
    id: string;

    chapterNo: number;

    nameBN: string;

    nameEng: string;

    descriptionBN: unknown;

    descriptionEng: unknown;
  };

  /*

   * Bookmark collection definitions are sent ONCE

   * at graph level.

   *

   * Individual bookmark objects contain bookmark

   * information, collectionIds, and progress state.

   *

   * This prevents repeating:

   *

   *   name

   *   color

   *   type

   *

   * inside every bookmarked graph item.

   *

   * This field is only added for authenticated users

   * who have at least one bookmark collection.

   */

  bookmarkCollections?: BookmarkCollectionData[];

  items: KnowledgeGraphItem[];

  relations: KnowledgeGraphRelation[];
}

/*

 * ==================================================

 * HELPERS

 * ==================================================

 */

function slugify(value: string): string {
  return value

    .trim()

    .toLowerCase()

    .replace(/\s+/g, "-")

    .replace(/[^a-z0-9\u0980-\u09ff-]/g, "")

    .replace(/-+/g, "-");
}

function buildQuestionTitle(questionPaper: {
  source: string;

  board: string | null;

  institution: string | null;

  year: number | null;
}): string {
  switch (questionPaper.source) {
    case "BOARD":
      return questionPaper.year !== null
        ? `${questionPaper.board ?? "Board"} Board ${questionPaper.year}`
        : `${questionPaper.board ?? "Board"} Board`;

    case "TEST_PAPER":
      return questionPaper.year !== null
        ? `${questionPaper.institution ?? "Test Paper"} ${questionPaper.year}`
        : (questionPaper.institution ?? "Test Paper");

    case "MODEL_TEST":
      return questionPaper.year !== null
        ? `Model Test ${questionPaper.year}`
        : "Model Test";

    case "GAME":
      return "Game";

    case "QUIZ":
      return "Quiz";

    case "EXTRA":
      return "Extra";

    default:
      return "Question";
  }
}

function normalizeBoardName(board: string | null): string | undefined {
  if (board === null) {
    return undefined;
  }

  const normalized = board.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  return normalized;
}

function normalizeInstitution(institution: string | null): string | undefined {
  if (institution === null) {
    return undefined;
  }

  const normalized = institution.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  return normalized;
}

function normalizeYear(year: number | null): number | undefined {
  return year ?? undefined;
}

/*

 * ==================================================

 * GRAPH ID HELPERS

 * ==================================================

 */

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

/*

 * ==================================================

 * QUESTION MAPPING

 * ==================================================

 */

interface QuestionMapping {
  type: KnowledgeLinkType;

  id: string;
}

/**

 * Prisma 8 RC currently exposes enum fields from generated

 * model rows as string values.

 *

 * We therefore validate the runtime value before treating it

 * as our stricter KnowledgeLinkType.

 */

function isKnowledgeLinkType(value: string | null): value is KnowledgeLinkType {
  return (
    value === "CHAPTER" ||
    value === "LESSON" ||
    value === "CONCEPT" ||
    value === "EXECUTION"
  );
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
}): QuestionMapping[] {
  const mappings: QuestionMapping[] = [];

  const links = [
    {
      type: cq.quesKaLinkType,

      id: cq.quesKaLinkId,
    },

    {
      type: cq.quesKhaLinkType,

      id: cq.quesKhaLinkId,
    },

    {
      type: cq.quesGaLinkType,

      id: cq.quesGaLinkId,
    },

    {
      type: cq.quesGhaLinkType,

      id: cq.quesGhaLinkId,
    },
  ];

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

function getMCQMappings(mcq: {
  linkType: string | null;

  linkId: string | null;
}): QuestionMapping[] {
  if (mcq.linkId === null || !isKnowledgeLinkType(mcq.linkType)) {
    return [];
  }

  return [
    {
      type: mcq.linkType,

      id: mcq.linkId,
    },
  ];
}

/*

 * ==================================================

 * QUESTION SOURCE

 * ==================================================

 */

function getQuestionSourceType(source: string): QuestionSource {
  switch (source) {
    case "BOARD":
      return "board";

    case "TEST_PAPER":
      return "test-paper";

    case "MODEL_TEST":
      return "model-test";

    case "GAME":
      return "game";

    case "QUIZ":
      return "quiz";

    case "EXTRA":
      return "extra";

    default:
      return "extra";
  }
}

/*

 * ==================================================

 * QUESTION META

 * ==================================================

 */

function buildQuestionMeta(questionPaper: {
  id: string;

  source: string;

  board: string | null;

  institution: string | null;

  year: number | null;
}): {
  sourceType: QuestionSource;

  board?: string;

  institution?: string;

  year?: number;

  paperId: string;
} {
  const meta: {
    sourceType: QuestionSource;

    board?: string;

    institution?: string;

    year?: number;

    paperId: string;
  } = {
    sourceType: getQuestionSourceType(questionPaper.source),

    paperId: questionPaper.id,
  };

  const board = normalizeBoardName(questionPaper.board);

  const institution = normalizeInstitution(questionPaper.institution);

  const year = normalizeYear(questionPaper.year);

  if (board !== undefined) {
    meta.board = board;
  }

  if (institution !== undefined) {
    meta.institution = institution;
  }

  if (year !== undefined) {
    meta.year = year;
  }

  return meta;
}

/*

 * ==================================================

 * BOOKMARK / PROGRESS HELPERS

 * ==================================================

 */

type PersonalizedGraphTargetType = "CONCEPT" | "EXECUTION" | "CQ" | "MCQ";

interface PersonalizedGraphTarget {
  targetType: PersonalizedGraphTargetType;

  targetId: string;
}

/**

 * Convert a graph item into the corresponding

 * bookmark/progress target.

 *

 * Only these graph item types carry personalization:

 *

 *   concept -> CONCEPT

 *   math    -> EXECUTION

 *   cq      -> CQ

 *   mcq     -> MCQ

 *

 * Chapter and lesson intentionally return null.

 */

function getPersonalizedTargetFromGraphItem(
  item: KnowledgeGraphItem,
): PersonalizedGraphTarget | null {
  switch (item.type) {
    case "concept":
      return {
        targetType: "CONCEPT",

        targetId: item.id.replace("concept-", ""),
      };

    case "math":
      return {
        targetType: "EXECUTION",

        targetId: item.id.replace("math-", ""),
      };

    case "cq":
      return {
        targetType: "CQ",

        targetId: item.id.replace("cq-", ""),
      };

    case "mcq":
      return {
        targetType: "MCQ",

        targetId: item.id.replace("mcq-", ""),
      };

    case "chapter":

    case "lesson":
      return null;
  }
}

/**

 * Enrich graph items with bookmark + progress state.

 *

 * Important rules:

 *

 * 1. Only concept/math/cq/mcq are enriched.

 * 2. Chapter/lesson never receive bookmark.

 * 3. Progress exists independently from Bookmark.

 * 4. If no Bookmark row exists, a default bookmark

 *    package is still returned so progress can travel

 *    through the existing graph personalization shape.

 * 5. Missing progress means NOT_STARTED.

 * 6. questionMeta remains completely separate.

 */

function applyPersonalizationStates(
  items: KnowledgeGraphItem[],

  bookmarkStates: Map<string, BookmarkState>,

  progressStates: Map<
    string,
    { status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" }
  >,
): void {
  for (const item of items) {
    const target = getPersonalizedTargetFromGraphItem(item);

    if (!target) {
      continue;
    }

    const key = `${target.targetType}:${target.targetId}`;

    const bookmarkState = bookmarkStates.get(key);

    const progressState = progressStates.get(key);

    item.bookmark = {
      bookmarked: bookmarkState?.bookmarked ?? false,

      bookmarkId: bookmarkState?.bookmarkId ?? "",

      starRating: bookmarkState?.starRating ?? 0,

      collectionIds: bookmarkState?.collectionIds ?? [],

      progress: {
        status: progressState?.status ?? "NOT_STARTED",
      },
    };
  }
}

/**

 * Convert database BookmarkCollection rows into the

 * public graph response shape.

 *

 * Collection definitions are sent once at the top level.

 */

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

    defaultType:
      collection.defaultType as BookmarkCollectionData["defaultType"],

    sortOrder: collection.sortOrder,
  }));
}

/*

 * ==================================================

 * CHAPTER GRAPH

 * ==================================================

 */

export async function getChapterKnowledgeGraph(
  chapterId: string,

  userId?: string,
): Promise<KnowledgeGraphData | null> {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    return null;
  }

  const lessons = await prisma.orm.public.Lesson.where({
    chapterId,

    isActive: true,
  })

    .orderBy((lesson) => lesson.id.asc())

    .all();

  const items: KnowledgeGraphItem[] = [];

  const relations: KnowledgeGraphRelation[] = [];

  /*

   * --------------------------------------------------

   * CHAPTER

   * --------------------------------------------------

   */

  const chapterGraphId = `chapter-${chapter.id}`;

  items.push({
    id: chapterGraphId,

    type: "chapter",

    title: chapter.nameBN,

    slug: slugify(chapter.nameEng),

    description: chapter.descriptionBN,

    descriptionBN: chapter.descriptionBN,

    descriptionEng: chapter.descriptionEng,
  });

  /*

   * --------------------------------------------------

   * LESSONS

   * --------------------------------------------------

   */

  for (const lesson of lessons) {
    const lessonGraphId = `lesson-${lesson.id}`;

    const lessonTitle =
      lesson.lessonNo !== null
        ? `${lesson.lessonNo} ${lesson.nameBN}`
        : lesson.nameBN;

    items.push({
      id: lessonGraphId,

      type: "lesson",

      title: lessonTitle,

      slug: slugify(lesson.nameEng),

      description: lesson.descriptionBN,

      descriptionBN: lesson.descriptionBN,

      descriptionEng: lesson.descriptionEng,

      parentId: chapterGraphId,
    });

    relations.push({
      id: `contains-chapter-${chapter.id}-lesson-${lesson.id}`,

      source: chapterGraphId,

      target: lessonGraphId,

      type: "contains",
    });

    /*

     * ------------------------------------------------

     * CONCEPTS

     * ------------------------------------------------

     */

    const concepts = await prisma.orm.public.Concept.where({
      lessonId: lesson.id,

      isActive: true,
    })

      .orderBy((concept) => concept.id.asc())

      .all();

    for (const concept of concepts) {
      const conceptGraphId = `concept-${concept.id}`;

      items.push({
        id: conceptGraphId,

        type: "concept",

        title: concept.nameBN,

        slug: slugify(concept.nameEng),

        description: concept.descriptionBN,

        descriptionBN: concept.descriptionBN,

        descriptionEng: concept.descriptionEng,

        parentId: lessonGraphId,
      });

      relations.push({
        id: `contains-lesson-${lesson.id}-concept-${concept.id}`,

        source: lessonGraphId,

        target: conceptGraphId,

        type: "contains",
      });

      /*

       * ------------------------------------------------

       * EXECUTIONS

       * ------------------------------------------------

       */

      const executions = await prisma.orm.public.Execution.where({
        conceptId: concept.id,

        isActive: true,
      })

        .orderBy((execution) => execution.id.asc())

        .all();

      for (const execution of executions) {
        const executionGraphId = `math-${execution.id}`;

        items.push({
          id: executionGraphId,

          type: "math",

          title: execution.nameBN,

          slug: slugify(execution.nameEng),

          description: execution.descriptionBN,

          descriptionBN: execution.descriptionBN,

          descriptionEng: execution.descriptionEng,

          parentId: conceptGraphId,
        });

        relations.push({
          id: `contains-concept-${concept.id}-execution-${execution.id}`,

          source: conceptGraphId,

          target: executionGraphId,

          type: "contains",
        });
      }
    }
  }

  /*

   * ==================================================

   * HIERARCHY IDS

   * ==================================================

   */

  const hierarchyIds = new Set<string>();

  for (const item of items) {
    if (
      item.type === "chapter" ||
      item.type === "lesson" ||
      item.type === "concept" ||
      item.type === "math"
    ) {
      hierarchyIds.add(item.id);
    }
  }

  /*

   * ==================================================

   * CQs

   * ==================================================

   */

  const cqRecords = await prisma.orm.public.CQ.where({
    isActive: true,
  }).all();

  let cqSideIndex = 0;

  for (const cq of cqRecords) {
    const mappings = getCQMappings(cq);

    const chapterMappings = mappings.filter((mapping) =>
      hierarchyIds.has(getGraphId(mapping.type, mapping.id)),
    );

    if (chapterMappings.length === 0) {
      continue;
    }

    const questionPaper = await prisma.orm.public.QuestionPaper.first({
      id: cq.questionPaperId,
    });

    if (!questionPaper || !questionPaper.isActive) {
      continue;
    }

    if (questionPaper.questionType !== "CQ") {
      continue;
    }

    const questionGraphId = `cq-${cq.id}`;

    items.push({
      id: questionGraphId,

      type: "cq",

      title: buildQuestionTitle(questionPaper),

      slug: `cq-${cq.id}`,

      description: cq.descriptionBN,

      descriptionBN: cq.descriptionBN,

      descriptionEng: cq.descriptionEng,

      side: cqSideIndex % 2 === 0 ? "left" : "right",

      questionMeta: buildQuestionMeta(questionPaper),
    });

    cqSideIndex += 1;

    /*

     * A single CQ can have multiple hierarchy mappings.

     */

    for (const mapping of chapterMappings) {
      const sourceId = getGraphId(mapping.type, mapping.id);

      relations.push({
        id: `question-cq-${cq.id}-${mapping.type}-${mapping.id}`,

        source: sourceId,

        target: questionGraphId,

        type: "question",
      });
    }
  }

  /*

   * ==================================================

   * MCQs

   * ==================================================

   */

  const mcqRecords = await prisma.orm.public.MCQ.where({
    isActive: true,
  }).all();

  let mcqSideIndex = 0;

  for (const mcq of mcqRecords) {
    const mappings = getMCQMappings(mcq);

    const chapterMappings = mappings.filter((mapping) =>
      hierarchyIds.has(getGraphId(mapping.type, mapping.id)),
    );

    if (chapterMappings.length === 0) {
      continue;
    }

    const questionPaper = await prisma.orm.public.QuestionPaper.first({
      id: mcq.questionPaperId,
    });

    if (!questionPaper || !questionPaper.isActive) {
      continue;
    }

    if (questionPaper.questionType !== "MCQ") {
      continue;
    }

    const questionGraphId = `mcq-${mcq.id}`;

    items.push({
      id: questionGraphId,

      type: "mcq",

      title: buildQuestionTitle(questionPaper),

      slug: `mcq-${mcq.id}`,

      description: mcq.descriptionBN,

      descriptionBN: mcq.descriptionBN,

      descriptionEng: mcq.descriptionEng,

      side: mcqSideIndex % 2 === 0 ? "left" : "right",

      questionMeta: buildQuestionMeta(questionPaper),
    });

    mcqSideIndex += 1;

    for (const mapping of chapterMappings) {
      const sourceId = getGraphId(mapping.type, mapping.id);

      relations.push({
        id: `question-mcq-${mcq.id}-${mapping.type}-${mapping.id}`,

        source: sourceId,

        target: questionGraphId,

        type: "question",
      });
    }
  }

  /*

   * ==================================================

   * OPTIONAL PERSONALIZATION ENRICHMENT

   * ==================================================

   *

   * This section is deliberately at the END of graph

   * construction.

   *

   * Therefore:

   *

   * - public graph requests can return normally

   * - no bookmark/progress query happens without userId

   * - chapter/lesson never receive personalization data

   * - only relevant component types are checked

   * - Bookmark and QuestionProgress remain separate in DB

   * - the response combines them into the existing

   *   bookmark package used by KnowledgeExplorer

   */

  let bookmarkCollections: BookmarkCollectionData[] | undefined;

  if (userId !== undefined) {
    /*

     * ------------------------------------------------

     * STEP 1

     * Load this user's collections.

     *

     * IMPORTANT:

     *

     * We do NOT call ensureDefaultBookmarkCollections().

     *

     * Viewing the graph must NEVER create bookmark

     * collections.

     * ------------------------------------------------

     */

    const collections = await prisma.orm.public.BookmarkCollection.where({
      userId,
    })

      .orderBy((collection) => collection.sortOrder.asc())

      .all();

    if (collections.length > 0) {
      /*

       * Send collection metadata ONCE at graph level.

       */

      bookmarkCollections = buildBookmarkCollectionData(collections);
    }

    /*

     * ------------------------------------------------

     * STEP 2

     * Collect only graph targets that support both

     * bookmark and progress personalization.

     * ------------------------------------------------

     */

    const targets: PersonalizedGraphTarget[] = [];

    for (const item of items) {
      const target = getPersonalizedTargetFromGraphItem(item);

      if (target) {
        targets.push(target);
      }
    }

    /*

     * ------------------------------------------------

     * STEP 3

     * Load bookmark and progress state independently.

     *

     * Progress MUST NOT depend on bookmark collections.

     * A student can have progress without ever creating

     * or using a bookmark.

     * ------------------------------------------------

     */

    if (targets.length > 0) {
      const [bookmarkStates, progressStates] = await Promise.all([
        getBookmarkStates(userId, targets),

        getQuestionProgressStates(userId, targets),
      ]);

      /*

       * ------------------------------------------------

       * STEP 4

       * Merge both states into the existing bookmark

       * package consumed by KnowledgeExplorer.

       * ------------------------------------------------

       */

      applyPersonalizationStates(items, bookmarkStates, progressStates);
    }
  }

  /*

   * ==================================================

   * RESULT

   * ==================================================

   */

  const result: KnowledgeGraphData = {
    chapter: {
      id: chapter.id,

      chapterNo: chapter.chapterNo,

      nameBN: chapter.nameBN,

      nameEng: chapter.nameEng,

      descriptionBN: chapter.descriptionBN,

      descriptionEng: chapter.descriptionEng,
    },

    items,

    relations,
  };

  /*

   * Do not add bookmarkCollections for:

   *

   * - anonymous users

   * - authenticated users with no collections

   *

   * This keeps the public graph response free of

   * bookmark-specific data.

   */

  if (bookmarkCollections !== undefined) {
    result.bookmarkCollections = bookmarkCollections;
  }

  return result;
}

/*

 * ==================================================

 * FULL CQ

 * ==================================================

 */

export async function getCQDetail(id: string) {
  const cq = await prisma.orm.public.CQ.first({
    id,
  });

  if (!cq || !cq.isActive) {
    return null;
  }

  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id: cq.questionPaperId,
  });

  if (!questionPaper || !questionPaper.isActive) {
    return null;
  }

  return {
    id: cq.id,

    questionPaperId: cq.questionPaperId,

    qusNo: cq.qusNo,

    source: {
      type: questionPaper.source,

      board: questionPaper.board,

      institution: questionPaper.institution,

      year: questionPaper.year,
    },

    descriptionBN: cq.descriptionBN,

    descriptionEng: cq.descriptionEng,

    stimulus: cq.quesUddipok,

    questions: {
      a: cq.quesKaEng,

      b: cq.quesKhaEng,

      c: cq.quesGaEng,

      d: cq.quesGhaEng,
    },

    answers: {
      a: cq.ansKaEng,

      b: cq.ansKhaEng,

      c: cq.ansGaEng,

      d: cq.ansGhaEng,
    },

    imageUrl: cq.imageUrl,
  };
}

/*

 * ==================================================

 * FULL MCQ

 * ==================================================

 */

export async function getMCQDetail(id: string) {
  const mcq = await prisma.orm.public.MCQ.first({
    id,
  });

  if (!mcq || !mcq.isActive) {
    return null;
  }

  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id: mcq.questionPaperId,
  });

  if (!questionPaper || !questionPaper.isActive) {
    return null;
  }

  return {
    id: mcq.id,

    questionPaperId: mcq.questionPaperId,

    qusNo: mcq.qusNo,

    source: {
      type: questionPaper.source,

      board: questionPaper.board,

      institution: questionPaper.institution,

      year: questionPaper.year,
    },

    descriptionBN: mcq.descriptionBN,

    descriptionEng: mcq.descriptionEng,

    stimulus: null,

    options: mcq.optionsEng,

    rightAnswer: mcq.rightAns,

    explanation: mcq.explanationEng,

    imageUrl: mcq.imageUrl,
  };
}

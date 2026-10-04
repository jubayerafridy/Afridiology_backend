import { prisma } from "../../../config/prisma.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

export type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

export type AdminKnowledgeItemType =
  | "chapter"
  | "lesson"
  | "concept"
  | "math"
  | "cq";

export type QuestionSource =
  | "board"
  | "test-paper"
  | "model-test"
  | "game"
  | "quiz"
  | "extra";

/*
 * ==================================================
 * DOCUMENT
 * ==================================================
 *
 * descriptionBN / descriptionEng are the complete
 * ordered documents for an entity.
 *
 * Examples:
 *
 * [
 *   {
 *     type: "text",
 *     content: "Some text"
 *   },
 *   {
 *     type: "lesson",
 *     lessonID: 15
 *   },
 *   {
 *     type: "heading",
 *     content: "Introduction"
 *   },
 *   {
 *     type: "concept",
 *     conceptID: 23
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - Content blocks do NOT need an id.
 * - Array position determines rendering order.
 * - Entity IDs are used only when a block references
 *   another relational entity.
 * - No flow.
 * - No structure.
 */

export interface AdminKnowledgeDocumentItem {
  type: string;
  [key: string]: unknown;
}

export type AdminKnowledgeDocument = AdminKnowledgeDocumentItem[];

/*
 * ==================================================
 * GRAPH ITEM
 * ==================================================
 */

export interface AdminKnowledgeGraphItem {
  id: string;
  type: AdminKnowledgeItemType;
  title: string;
  slug: string;

  description?: unknown;
  descriptionBN?: AdminKnowledgeDocument;
  descriptionEng?: AdminKnowledgeDocument;

  parentId?: string;
  side?: "left" | "right";

  questionMeta?: {
    sourceType: QuestionSource;
    board?: string;
    institution?: string;
    year?: number;
    paperId: number;
  };
}

/*
 * ==================================================
 * GRAPH RELATION
 * ==================================================
 */

export interface AdminKnowledgeGraphRelation {
  id: string;
  source: string;
  target: string;
  type: "contains" | "question";
}

/*
 * ==================================================
 * GRAPH RESULT
 * ==================================================
 */

export interface AdminKnowledgeGraphData {
  chapter: {
    id: number;
    chapterNo: number;
    nameBN: string;
    nameEng: string;
    descriptionBN: AdminKnowledgeDocument;
    descriptionEng: AdminKnowledgeDocument;
  };

  items: AdminKnowledgeGraphItem[];

  relations: AdminKnowledgeGraphRelation[];
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
    .replace(/[^\w\u0980-\u09ff-]/g, "")
    .replace(/-+/g, "-");
}

/*
 * ==================================================
 * GRAPH IDS
 * ==================================================
 */

function getGraphId(type: KnowledgeLinkType, id: number): string {
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
 * DOCUMENT NORMALIZATION
 * ==================================================
 *
 * The document array itself controls order.
 *
 * We intentionally do NOT require:
 *
 * {
 *   id: 1,
 *   type: "text"
 * }
 *
 * A valid block can simply be:
 *
 * {
 *   type: "text",
 *   content: "..."
 * }
 *
 * or:
 *
 * {
 *   type: "lesson",
 *   lessonID: 15
 * }
 *
 * Unknown additional properties are preserved.
 */

function normalizeDocument(value: unknown): AdminKnowledgeDocument {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: AdminKnowledgeDocument = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }

    const candidate = item as {
      type?: unknown;
      [key: string]: unknown;
    };

    if (
      typeof candidate.type !== "string" ||
      candidate.type.trim().length === 0
    ) {
      continue;
    }

    result.push(candidate as AdminKnowledgeDocumentItem);
  }

  return result;
}

/*
 * ==================================================
 * QUESTION MAPPING
 * ==================================================
 */

interface QuestionMapping {
  type: KnowledgeLinkType;
  id: number;
}

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
  quesKaLinkId: number | null;

  quesKhaLinkType: string | null;
  quesKhaLinkId: number | null;

  quesGaLinkType: string | null;
  quesGaLinkId: number | null;

  quesGhaLinkType: string | null;
  quesGhaLinkId: number | null;
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
 * QUESTION TITLE
 * ==================================================
 */

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

/*
 * ==================================================
 * QUESTION META
 * ==================================================
 */

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

function buildQuestionMeta(questionPaper: {
  id: number;
  source: string;
  board: string | null;
  institution: string | null;
  year: number | null;
}): {
  sourceType: QuestionSource;
  board?: string;
  institution?: string;
  year?: number;
  paperId: number;
} {
  const meta: {
    sourceType: QuestionSource;
    board?: string;
    institution?: string;
    year?: number;
    paperId: number;
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
 * ADMIN CHAPTER KNOWLEDGE GRAPH
 * ==================================================
 *
 * RELATIONAL HIERARCHY:
 *
 * Chapter
 *   ↓ chapterId
 * Lesson
 *   ↓ lessonId
 * Concept
 *   ↓ conceptId
 * Execution
 *
 * The relational foreign keys determine which entities
 * belong to which parent.
 *
 * The description arrays determine the visual/document
 * order inside each entity.
 *
 * Example Chapter.descriptionBN:
 *
 * [
 *   { type: "text", content: "..." },
 *   { type: "lesson", lessonID: 5 },
 *   { type: "heading", content: "..." },
 *   { type: "lesson", lessonID: 8 }
 * ]
 *
 * The graph does NOT reconstruct this order.
 *
 * It returns the description arrays exactly in their
 * stored order.
 */

export async function getAdminChapterKnowledgeGraph(
  chapterId: number,
): Promise<AdminKnowledgeGraphData | null> {
  /*
   * ==================================================
   * CHAPTER
   * ==================================================
   */

  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    return null;
  }

  const chapterDescriptionBN = normalizeDocument(chapter.descriptionBN);

  const chapterDescriptionEng = normalizeDocument(chapter.descriptionEng);

  const items: AdminKnowledgeGraphItem[] = [];

  const relations: AdminKnowledgeGraphRelation[] = [];

  const chapterGraphId = `chapter-${chapter.id}`;

  /*
   * ==================================================
   * CHAPTER ITEM
   * ==================================================
   *
   * The description arrays are returned exactly as
   * stored.
   *
   * No child references are removed.
   */

  items.push({
    id: chapterGraphId,
    type: "chapter",
    title: chapter.nameBN,
    slug: slugify(chapter.nameEng),

    description: chapterDescriptionBN,
    descriptionBN: chapterDescriptionBN,
    descriptionEng: chapterDescriptionEng,
  });

  /*
   * ==================================================
   * LESSONS
   * ==================================================
   *
   * Lesson.chapterId remains the relational authority
   * for determining which lessons belong to the chapter.
   *
   * The lesson references inside chapter.descriptionBN
   * / descriptionEng determine where those lessons are
   * displayed inside the chapter document.
   */

  const lessons = await prisma.orm.public.Lesson.where({
    chapterId,
    isActive: true,
  })
    .orderBy((lesson) => lesson.id.asc())
    .all();

  /*
   * ==================================================
   * LESSON LOOP
   * ==================================================
   */

  for (const lesson of lessons) {
    const lessonGraphId = `lesson-${lesson.id}`;

    const lessonDescriptionBN = normalizeDocument(lesson.descriptionBN);

    const lessonDescriptionEng = normalizeDocument(lesson.descriptionEng);

    const lessonTitle =
      lesson.lessonNo !== null
        ? `${lesson.lessonNo} ${lesson.nameBN}`
        : lesson.nameBN;

    /*
     * ==================================================
     * LESSON ITEM
     * ==================================================
     */

    items.push({
      id: lessonGraphId,
      type: "lesson",
      title: lessonTitle,
      slug: slugify(lesson.nameEng),

      description: lessonDescriptionBN,
      descriptionBN: lessonDescriptionBN,
      descriptionEng: lessonDescriptionEng,

      parentId: chapterGraphId,
    });

    /*
     * ==================================================
     * CHAPTER → LESSON
     * ==================================================
     *
     * This graph relation is separate from the document
     * reference block.
     *
     * The document reference:
     *
     * {
     *   type: "lesson",
     *   lessonID: lesson.id
     * }
     *
     * controls document position.
     *
     * This graph relation allows the graph UI to understand
     * the relational hierarchy.
     */

    relations.push({
      id: `contains-chapter-${chapter.id}-lesson-${lesson.id}`,
      source: chapterGraphId,
      target: lessonGraphId,
      type: "contains",
    });

    /*
     * ==================================================
     * CONCEPTS
     * ==================================================
     *
     * Concept.lessonId determines ownership.
     */

    const concepts = await prisma.orm.public.Concept.where({
      lessonId: lesson.id,
      isActive: true,
    })
      .orderBy((concept) => concept.id.asc())
      .all();

    /*
     * ==================================================
     * CONCEPT LOOP
     * ==================================================
     */

    for (const concept of concepts) {
      const conceptGraphId = `concept-${concept.id}`;

      const conceptDescriptionBN = normalizeDocument(concept.descriptionBN);

      const conceptDescriptionEng = normalizeDocument(concept.descriptionEng);

      /*
       * ==================================================
       * CONCEPT ITEM
       * ==================================================
       */

      items.push({
        id: conceptGraphId,
        type: "concept",
        title: concept.nameBN,
        slug: slugify(concept.nameEng),

        description: conceptDescriptionBN,
        descriptionBN: conceptDescriptionBN,
        descriptionEng: conceptDescriptionEng,

        parentId: lessonGraphId,
      });

      /*
       * ==================================================
       * LESSON → CONCEPT
       * ==================================================
       */

      relations.push({
        id: `contains-lesson-${lesson.id}-concept-${concept.id}`,
        source: lessonGraphId,
        target: conceptGraphId,
        type: "contains",
      });

      /*
       * ==================================================
       * EXECUTIONS
       * ==================================================
       *
       * Execution.conceptId determines ownership.
       */

      const executions = await prisma.orm.public.Execution.where({
        conceptId: concept.id,
        isActive: true,
      })
        .orderBy((execution) => execution.id.asc())
        .all();

      /*
       * ==================================================
       * EXECUTION LOOP
       * ==================================================
       */

      for (const execution of executions) {
        const executionGraphId = `math-${execution.id}`;

        const executionDescriptionBN = normalizeDocument(
          execution.descriptionBN,
        );

        const executionDescriptionEng = normalizeDocument(
          execution.descriptionEng,
        );

        /*
         * ==================================================
         * EXECUTION / MATH ITEM
         * ==================================================
         *
         * Execution is the bottom relational hierarchy
         * level.
         *
         * Its description arrays contain its own content.
         */

        items.push({
          id: executionGraphId,
          type: "math",
          title: execution.nameBN,
          slug: slugify(execution.nameEng),

          description: executionDescriptionBN,
          descriptionBN: executionDescriptionBN,
          descriptionEng: executionDescriptionEng,

          parentId: conceptGraphId,
        });

        /*
         * ==================================================
         * CONCEPT → EXECUTION
         * ==================================================
         */

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
   *
   * Only nodes actually present in this chapter graph
   * are eligible for question relationships.
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
   *
   * CQ records remain completely independent from the
   * curriculum hierarchy.
   *
   * A CQ may connect to:
   *
   * Chapter
   * Lesson
   * Concept
   * Execution
   *
   * Deleting a hierarchy entity does not delete CQ data.
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

      description: normalizeDocument(cq.descriptionBN),

      descriptionBN: normalizeDocument(cq.descriptionBN),

      descriptionEng: normalizeDocument(cq.descriptionEng),

      side: cqSideIndex % 2 === 0 ? "left" : "right",

      questionMeta: buildQuestionMeta(questionPaper),
    });

    cqSideIndex += 1;

    /*
     * ==================================================
     * CQ → HIERARCHY RELATIONS
     * ==================================================
     *
     * A single CQ can connect to multiple hierarchy
     * entities.
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
   * RESULT
   * ==================================================
   *
   * IMPORTANT:
   *
   * The chapter document is returned directly from
   * descriptionBN / descriptionEng.
   *
   * No structure.
   * No flow.
   * No artificial child ordering.
   */

  return {
    chapter: {
      id: chapter.id,
      chapterNo: chapter.chapterNo,
      nameBN: chapter.nameBN,
      nameEng: chapter.nameEng,

      descriptionBN: chapterDescriptionBN,

      descriptionEng: chapterDescriptionEng,
    },

    items,

    relations,
  };
}

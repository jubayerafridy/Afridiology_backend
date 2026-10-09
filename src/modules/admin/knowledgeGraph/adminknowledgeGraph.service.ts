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
  | "cq"
  | "mcq";

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

 *     lessonID: "15"

 *   },

 *   {

 *     type: "heading",

 *     content: "Introduction"

 *   },

 *   {

 *     type: "concept",

 *     conceptID: "23"

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

/*

 * ==================================================

 * DOCUMENT ITEM

 * ==================================================

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

  /*

   * Question active state.

   *

   * This is intentionally returned for the ADMIN graph

   * for both CQ and MCQ.

   *

   * The admin must be able to see both:

   *

   *   isActive: true

   *   isActive: false

   *

   * Student-facing graph filtering is handled separately.

   */

  isActive?: boolean;

  /*

   * ==================================================

   * QUESTION PAYLOAD

   * ==================================================

   *

   * CQ and MCQ graph nodes expose their complete stored

   * question data so the admin frontend does not need a

   * second question-specific request just to render/edit

   * the question from the knowledge graph.

   *

   * These fields are optional because only CQ/MCQ items use

   * them. Existing chapter/lesson/concept/math items are

   * unchanged.

   */

  questionPaperId?: string | null;

  qusNo?: number | null;

  point?: number | null;

  imageUrl?: string | null;

  ytLink?: string | null;

  // CQ — ক

  quesKaBN?: string | null;

  quesKaEng?: string | null;

  quesKaLinkType?: KnowledgeLinkType | null;

  quesKaLinkId?: string | null;

  ansKaBN?: string | null;

  ansKaEng?: string | null;

  // CQ — খ

  quesKhaBN?: string | null;

  quesKhaEng?: string | null;

  quesKhaLinkType?: KnowledgeLinkType | null;

  quesKhaLinkId?: string | null;

  ansKhaBN?: string | null;

  ansKhaEng?: string | null;

  // CQ — গ

  quesGaBN?: string | null;

  quesGaEng?: string | null;

  quesGaLinkType?: KnowledgeLinkType | null;

  quesGaLinkId?: string | null;

  ansGaBN?: string | null;

  ansGaEng?: string | null;

  // CQ — ঘ

  quesGhaBN?: string | null;

  quesGhaEng?: string | null;

  quesGhaLinkType?: KnowledgeLinkType | null;

  quesGhaLinkId?: string | null;

  ansGhaBN?: string | null;

  ansGhaEng?: string | null;

  // MCQ direct knowledge connection
  linkType?: KnowledgeLinkType | null;
  linkId?: string | null;

  // MCQ question content
  optionsBN?: unknown;

  optionsEng?: unknown;

  rightAns?: number | null;

  explanationBN?: unknown;

  explanationEng?: unknown;

  questionMeta?: {
    sourceType: QuestionSource;

    board?: string;

    institution?: string;

    year?: number;

    paperId: string;
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
    id: string;

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

 *   lessonID: "15"

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

  id: string;
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

/*

 * ==================================================

 * MCQ MAPPING

 * ==================================================

 *

 * An MCQ has exactly one direct knowledge link.

 *

 * The link can point to:

 *

 * Chapter

 * Lesson

 * Concept

 * Execution

 *

 * Ancestors are derived through the hierarchy.

 */

function getMCQMapping(mcq: {
  linkType: string | null;

  linkId: string | null;
}): QuestionMapping | null {
  if (mcq.linkId !== null && isKnowledgeLinkType(mcq.linkType)) {
    return {
      type: mcq.linkType,

      id: mcq.linkId,
    };
  }

  return null;
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

 * The graph does NOT reconstruct this order.

 *

 * It returns the description arrays exactly in their

 * stored order.

 */

export async function getAdminChapterKnowledgeGraph(
  chapterId: string,
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

   * ADMIN GRAPH RULE:

   *

   * Both active and inactive CQs are returned.

   *

   * isActive is included on the graph item so the admin

   * frontend can display and change the status.

   *

   * Student-facing filtering is NOT performed here.

   *

   * Each CQ part may have its own direct knowledge link:

   *

   * Chapter / Lesson / Concept / Execution.

   *

   * We store only those direct links. Ancestors are

   * already represented by the hierarchy relations above.

   */

  const cqRecords = await prisma.orm.public.CQ.all();

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

    /*

     * Question Paper must exist because its metadata is

     * required to build the question node.

     *

     * IMPORTANT:

     *

     * We intentionally DO NOT check questionPaper.isActive.

     *

     * Admin graph must contain questions regardless of

     * active/inactive status.

     */

    if (!questionPaper) {
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

      /*

       * Admin must know the current active state.

       */

      isActive: cq.isActive,

      /*

       * Keep the complete CQ content available to the admin

       * graph. Each CQ part has its own independent

       * knowledge link, so all four parts are returned exactly

       * as stored on the CQ record.

       */

      questionPaperId: cq.questionPaperId,

      qusNo: cq.qusNo,

      point: cq.point,

      imageUrl: cq.imageUrl,
      ytLink: cq.ytLink,

      description: normalizeDocument(cq.descriptionBN),

      descriptionBN: normalizeDocument(cq.descriptionBN),

      descriptionEng: normalizeDocument(cq.descriptionEng),

      // ক

      quesKaBN: cq.quesKaBN,

      quesKaEng: cq.quesKaEng,

      quesKaLinkType: isKnowledgeLinkType(cq.quesKaLinkType)
        ? cq.quesKaLinkType
        : null,

      quesKaLinkId: cq.quesKaLinkId,

      ansKaBN: cq.ansKaBN,

      ansKaEng: cq.ansKaEng,

      // খ

      quesKhaBN: cq.quesKhaBN,

      quesKhaEng: cq.quesKhaEng,

      quesKhaLinkType: isKnowledgeLinkType(cq.quesKhaLinkType)
        ? cq.quesKhaLinkType
        : null,

      quesKhaLinkId: cq.quesKhaLinkId,

      ansKhaBN: cq.ansKhaBN,

      ansKhaEng: cq.ansKhaEng,

      // গ

      quesGaBN: cq.quesGaBN,

      quesGaEng: cq.quesGaEng,

      quesGaLinkType: isKnowledgeLinkType(cq.quesGaLinkType)
        ? cq.quesGaLinkType
        : null,

      quesGaLinkId: cq.quesGaLinkId,

      ansGaBN: cq.ansGaBN,

      ansGaEng: cq.ansGaEng,

      // ঘ

      quesGhaBN: cq.quesGhaBN,

      quesGhaEng: cq.quesGhaEng,

      quesGhaLinkType: isKnowledgeLinkType(cq.quesGhaLinkType)
        ? cq.quesGhaLinkType
        : null,

      quesGhaLinkId: cq.quesGhaLinkId,

      ansGhaBN: cq.ansGhaBN,

      ansGhaEng: cq.ansGhaEng,

      side: cqSideIndex % 2 === 0 ? "left" : "right",

      questionMeta: buildQuestionMeta(questionPaper),
    });

    cqSideIndex += 1;

    /*

     * Only the CQ's actual direct links are connected.

     *

     * If a CQ part is linked to an Execution, the existing

     * Concept -> Execution -> ... hierarchy already gives

     * the ancestry.

     *

     * We do NOT create duplicate CQ links to the Concept,

     * Lesson, and Chapter.

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

   *

   * ADMIN GRAPH RULE:

   *

   * Both active and inactive MCQs are returned.

   *

   * isActive is included on the graph item so the admin

   * frontend can display and change the status.

   *

   * Student-facing filtering is NOT performed here.

   *

   * An MCQ has exactly one direct knowledge link:

   *

   * Chapter / Lesson / Concept / Execution

   *

   * We intentionally do NOT create ancestor links.

   * The existing hierarchy relations already provide them.

   *

   * IMPORTANT:

   *

   * MCQ.linkType + MCQ.linkId determine the MCQ's

   * knowledge-graph position.

   *

   * MCQ.questionPaperId is used only to retrieve the

   * QuestionPaper metadata for the graph item.

   *

   * QuestionPaper.questionType does NOT determine whether

   * this MCQ belongs in the graph.

   */

  const mcqRecords = await prisma.orm.public.MCQ.all();

  let mcqSideIndex = 0;

  for (const mcq of mcqRecords) {
    const mapping = getMCQMapping(mcq);

    if (!mapping) {
      continue;
    }

    const sourceId = getGraphId(mapping.type, mapping.id);

    /*

     * ==================================================

     * CHAPTER FILTER

     * ==================================================

     *

     * Only show the MCQ when its direct target belongs

     * to the chapter currently being requested.

     *

     * This is a hierarchy filter, NOT an isActive filter.

     */

    if (!hierarchyIds.has(sourceId)) {
      continue;
    }

    const questionPaper = await prisma.orm.public.QuestionPaper.first({
      id: mcq.questionPaperId,
    });

    /*

     * Question Paper must exist because its metadata is

     * required to build the question node.

     *

     * IMPORTANT:

     *

     * We intentionally DO NOT check questionPaper.isActive.

     *

     * Admin graph must contain questions regardless of

     * active/inactive status.

     *

     * We also intentionally DO NOT check

     * questionPaper.questionType.

     *

     * The MCQ table itself already determines:

     *

     *   1. which QuestionPaper it belongs to

     *      through questionPaperId

     *

     *   2. which knowledge node it belongs to

     *      through linkType + linkId

     *

     * Therefore QuestionPaper.questionType is not a

     * deciding factor for MCQ graph placement.

     */

    if (!questionPaper) {
      continue;
    }

    const questionGraphId = `mcq-${mcq.id}`;

    items.push({
      id: questionGraphId,

      type: "mcq",

      title: buildQuestionTitle(questionPaper),

      slug: `mcq-${mcq.id}`,

      /*

       * Admin must know the current active state.

       */

      isActive: mcq.isActive,

      // The MCQ has one direct knowledge connection.
      linkType: isKnowledgeLinkType(mcq.linkType) ? mcq.linkType : null,
      linkId: mcq.linkId,

      /*

       * Keep the complete MCQ content available to the admin

       * graph so the frontend can render/edit it directly.

       */

      questionPaperId: mcq.questionPaperId,

      qusNo: mcq.qusNo,

      imageUrl: mcq.imageUrl,

      ytLink: mcq.ytLink,

      description: normalizeDocument(mcq.descriptionBN),

      descriptionBN: normalizeDocument(mcq.descriptionBN),

      descriptionEng: normalizeDocument(mcq.descriptionEng),

      optionsBN: mcq.optionsBN,

      optionsEng: mcq.optionsEng,

      rightAns: mcq.rightAns,

      explanationBN: mcq.explanationBN,

      explanationEng: mcq.explanationEng,

      side: mcqSideIndex % 2 === 0 ? "right" : "left",

      questionMeta: buildQuestionMeta(questionPaper),
    });

    mcqSideIndex += 1;

    /*

     * IMPORTANT:

     *

     * Only one relation is created:

     *

     * direct target -> MCQ

     *

     * Example:

     *

     * Execution -> MCQ

     *

     * The frontend/backend can derive:

     *

     * Execution -> Concept -> Lesson -> Chapter

     *

     * from the existing hierarchy.

     *

     * No redundant ancestor question links are stored.

     */

    relations.push({
      id: `question-mcq-${mcq.id}-${mapping.type}-${mapping.id}`,

      source: sourceId,

      target: questionGraphId,

      type: "question",
    });
  }

  /*

   * ==================================================

   * RESULT

   * ==================================================

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

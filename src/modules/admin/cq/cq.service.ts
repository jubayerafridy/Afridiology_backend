import { prisma } from "./../../../config/prisma.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

export type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

export interface KnowledgeLinkInput {
  linkType?: KnowledgeLinkType | null;

  linkId?: string | null;
}

/**
 * Data required when creating a CQ.
 *
 * qusNo and point are optional.
 *
 * New CQs are inactive by default; isActive can be explicitly set.
 *
 * Ka, Kha and Ga must always have a direct knowledge link.
 *
 * Gha is optional.
 */
export interface CreateCQInput {
  questionPaperId: string;

  qusNo?: number | null;

  point?: number | null;

  isActive?: boolean;

  descriptionBN: JsonValue;

  descriptionEng: JsonValue;

  quesUddipok?: string | null;

  imageUrl?: string | null;

  // ক

  quesKaBN: string;

  quesKaEng: string;

  quesKaLinkType?: KnowledgeLinkType | null;

  quesKaLinkId?: string | null;

  ansKaBN?: string | null;

  ansKaEng?: string | null;

  // খ

  quesKhaBN: string;

  quesKhaEng: string;

  quesKhaLinkType?: KnowledgeLinkType | null;

  quesKhaLinkId?: string | null;

  ansKhaBN?: string | null;

  ansKhaEng?: string | null;

  // গ

  quesGaBN: string;

  quesGaEng: string;

  quesGaLinkType?: KnowledgeLinkType | null;

  quesGaLinkId?: string | null;

  ansGaBN?: string | null;

  ansGaEng?: string | null;

  // ঘ — optional

  quesGhaBN?: string | null;

  quesGhaEng?: string | null;

  quesGhaLinkType?: KnowledgeLinkType | null;

  quesGhaLinkId?: string | null;

  ansGhaBN?: string | null;

  ansGhaEng?: string | null;
}

/**
 * Partial update.
 *
 * undefined = do not change.
 *
 * null = clear a nullable field.
 *
 * isActive = true/false controls this CQ independently.
 */
export type UpdateCQInput = Partial<CreateCQInput>;

interface NormalizedLink {
  type: KnowledgeLinkType;

  id: string;
}

interface NormalizedCQData {
  questionPaperId: string;

  qusNo: number | null;

  point: number | null;

  isActive: boolean;

  descriptionBN: JsonValue;

  descriptionEng: JsonValue;

  quesUddipok: string | null;

  imageUrl: string | null;

  // ক

  quesKaBN: string;

  quesKaEng: string;

  quesKaLinkType: KnowledgeLinkType;

  quesKaLinkId: string;

  ansKaBN: string | null;

  ansKaEng: string | null;

  // খ

  quesKhaBN: string;

  quesKhaEng: string;

  quesKhaLinkType: KnowledgeLinkType;

  quesKhaLinkId: string;

  ansKhaBN: string | null;

  ansKhaEng: string | null;

  // গ

  quesGaBN: string;

  quesGaEng: string;

  quesGaLinkType: KnowledgeLinkType;

  quesGaLinkId: string;

  ansGaBN: string | null;

  ansGaEng: string | null;

  // ঘ — optional

  quesGhaBN: string | null;

  quesGhaEng: string | null;

  quesGhaLinkType: KnowledgeLinkType | null;

  quesGhaLinkId: string | null;

  ansGhaBN: string | null;

  ansGhaEng: string | null;
}

/**
 * Internal type used while merging an existing database row
 * with a partial update.
 *
 * Database link types are intentionally represented as string
 * because the generated ORM model exposes them as string | null.
 *
 * normalizeLinkType() validates them before they enter the
 * normalized application type.
 */
interface MergedCQInput {
  questionPaperId: string;

  qusNo: number | null;

  point: number | null;

  isActive: boolean;

  descriptionBN: JsonValue;

  descriptionEng: JsonValue;

  quesUddipok: string | null;

  imageUrl: string | null;

  // ক

  quesKaBN: string;

  quesKaEng: string;

  quesKaLinkType: string | null;

  quesKaLinkId: string | null;

  ansKaBN: string | null;

  ansKaEng: string | null;

  // খ

  quesKhaBN: string;

  quesKhaEng: string;

  quesKhaLinkType: string | null;

  quesKhaLinkId: string | null;

  ansKhaBN: string | null;

  ansKhaEng: string | null;

  // গ

  quesGaBN: string;

  quesGaEng: string;

  quesGaLinkType: string | null;

  quesGaLinkId: string | null;

  ansGaBN: string | null;

  ansGaEng: string | null;

  // ঘ

  quesGhaBN: string | null;

  quesGhaEng: string | null;

  quesGhaLinkType: string | null;

  quesGhaLinkId: string | null;

  ansGhaBN: string | null;

  ansGhaEng: string | null;
}

function normalizeOptionalText(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredText(value: string, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }

  return trimmed;
}

function normalizeOptionalQuestionNumber(value?: number | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Question number must be a positive integer");
  }

  return value;
}

function normalizeOptionalPoint(value?: number | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Point must be a non-negative integer");
  }

  return value;
}

function normalizeIsActive(value?: boolean): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw new Error("isActive must be a boolean");
  }

  return value;
}

/**
 * Converts a value coming from the database into the
 * application's KnowledgeLinkType.
 */
function normalizeLinkType(
  value: string | KnowledgeLinkType | null | undefined,
): KnowledgeLinkType | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    value === "CHAPTER" ||
    value === "LESSON" ||
    value === "CONCEPT" ||
    value === "EXECUTION"
  ) {
    return value;
  }

  throw new Error(`Invalid knowledge link type: ${value}`);
}

/**
 * Normalizes one direct knowledge link.
 *
 * A CQ part may directly point to:
 *
 * CHAPTER
 * LESSON
 * CONCEPT
 * EXECUTION
 *
 * Only this direct target is stored.
 * Ancestors are derived from the existing hierarchy.
 */
function normalizeKnowledgeLink(
  linkType: KnowledgeLinkType | string | null | undefined,
  linkId: string | null | undefined,
  fieldName: string,
  required: boolean,
): NormalizedLink | null {
  if (linkType === undefined && linkId === undefined) {
    if (required) {
      throw new Error(`${fieldName} link ID is required`);
    }

    return null;
  }

  if (linkId === undefined || linkId === null) {
    if (required) {
      throw new Error(`${fieldName} link ID is required`);
    }

    return null;
  }

  if (typeof linkId !== "string" || linkId.trim().length === 0) {
    throw new Error(`${fieldName} link ID is required`);
  }

  const normalizedType = normalizeLinkType(linkType);

  if (normalizedType === null) {
    throw new Error(`${fieldName} link type is required`);
  }

  return {
    type: normalizedType,

    id: linkId.trim(),
  };
}

/**
 * Gha is optional.
 *
 * If Gha has question text, its direct knowledge link is required.
 * If Gha is not provided, its link may remain null.
 */
function normalizeOptionalGhaLink(
  linkType: KnowledgeLinkType | string | null | undefined,
  linkId: string | null | undefined,
): NormalizedLink | null {
  return normalizeKnowledgeLink(linkType, linkId, "quesGha", false);
}

/**
 * Validates that a direct knowledge target belongs to the same subject
 * as the Question Paper.
 *
 * Only the direct target is stored. Ancestors are derived from the
 * existing Chapter -> Lesson -> Concept -> Execution hierarchy.
 */
async function validateKnowledgeLink(
  questionPaperSubjectId: string,
  link: NormalizedLink,
  fieldName: string,
): Promise<void> {
  switch (link.type) {
    case "CHAPTER": {
      const chapter = await prisma.orm.public.Chapter.first({
        id: link.id,
      });

      if (!chapter) {
        throw new Error(
          `${fieldName} chapter with ID ${link.id} was not found`,
        );
      }

      if (chapter.subjectId !== questionPaperSubjectId) {
        throw new Error(
          `${fieldName} chapter with ID ${link.id} does not belong to the Question Paper subject`,
        );
      }

      return;
    }

    case "LESSON": {
      const lesson = await prisma.orm.public.Lesson.first({
        id: link.id,
      });

      if (!lesson) {
        throw new Error(`${fieldName} lesson with ID ${link.id} was not found`);
      }

      const chapter = await prisma.orm.public.Chapter.first({
        id: lesson.chapterId,
      });

      if (!chapter) {
        throw new Error(
          `${fieldName} lesson with ID ${link.id} has no valid chapter`,
        );
      }

      if (chapter.subjectId !== questionPaperSubjectId) {
        throw new Error(
          `${fieldName} lesson with ID ${link.id} does not belong to the Question Paper subject`,
        );
      }

      return;
    }

    case "CONCEPT": {
      const concept = await prisma.orm.public.Concept.first({
        id: link.id,
      });

      if (!concept) {
        throw new Error(
          `${fieldName} concept with ID ${link.id} was not found`,
        );
      }

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      if (!lesson) {
        throw new Error(
          `${fieldName} concept with ID ${link.id} has no valid lesson`,
        );
      }

      const chapter = await prisma.orm.public.Chapter.first({
        id: lesson.chapterId,
      });

      if (!chapter) {
        throw new Error(
          `${fieldName} concept with ID ${link.id} has no valid chapter`,
        );
      }

      if (chapter.subjectId !== questionPaperSubjectId) {
        throw new Error(
          `${fieldName} concept with ID ${link.id} does not belong to the Question Paper subject`,
        );
      }

      return;
    }

    case "EXECUTION": {
      const execution = await prisma.orm.public.Execution.first({
        id: link.id,
      });

      if (!execution) {
        throw new Error(
          `${fieldName} execution with ID ${link.id} was not found`,
        );
      }

      const concept = await prisma.orm.public.Concept.first({
        id: execution.conceptId,
      });

      if (!concept) {
        throw new Error(
          `${fieldName} execution with ID ${link.id} has no valid concept`,
        );
      }

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      if (!lesson) {
        throw new Error(
          `${fieldName} execution with ID ${link.id} has no valid lesson`,
        );
      }

      const chapter = await prisma.orm.public.Chapter.first({
        id: lesson.chapterId,
      });

      if (!chapter) {
        throw new Error(
          `${fieldName} execution with ID ${link.id} has no valid chapter`,
        );
      }

      if (chapter.subjectId !== questionPaperSubjectId) {
        throw new Error(
          `${fieldName} execution with ID ${link.id} does not belong to the Question Paper subject`,
        );
      }

      return;
    }
  }
}

async function validateAllKnowledgeLinks(
  questionPaperSubjectId: string,
  links: Array<{
    fieldName: string;
    link: NormalizedLink | null;
  }>,
): Promise<void> {
  for (const item of links) {
    if (!item.link) {
      continue;
    }

    await validateKnowledgeLink(
      questionPaperSubjectId,
      item.link,
      item.fieldName,
    );
  }
}

function normalizeData(data: MergedCQInput | CreateCQInput): NormalizedCQData {
  const kaLink = normalizeKnowledgeLink(
    data.quesKaLinkType,
    data.quesKaLinkId,
    "quesKa",
    true,
  );

  const khaLink = normalizeKnowledgeLink(
    data.quesKhaLinkType,
    data.quesKhaLinkId,
    "quesKha",
    true,
  );

  const gaLink = normalizeKnowledgeLink(
    data.quesGaLinkType,
    data.quesGaLinkId,
    "quesGa",
    true,
  );

  const normalizedGhaBN = normalizeOptionalText(data.quesGhaBN);

  const normalizedGhaEng = normalizeOptionalText(data.quesGhaEng);

  const hasGhaQuestion = normalizedGhaBN !== null || normalizedGhaEng !== null;

  const normalizedGhaLink = normalizeOptionalGhaLink(
    data.quesGhaLinkType,
    data.quesGhaLinkId,
  );

  if (hasGhaQuestion) {
    if (normalizedGhaBN === null) {
      throw new Error("quesGhaBN is required when Gha is provided");
    }

    if (normalizedGhaEng === null) {
      throw new Error("quesGhaEng is required when Gha is provided");
    }

    if (!normalizedGhaLink) {
      throw new Error("quesGhaLinkId is required when Gha is provided");
    }
  }

  if (
    !hasGhaQuestion &&
    (normalizedGhaLink !== null ||
      normalizeOptionalText(data.ansGhaBN) !== null ||
      normalizeOptionalText(data.ansGhaEng) !== null)
  ) {
    throw new Error(
      "Gha question must be provided before Gha answer or knowledge link",
    );
  }

  return {
    questionPaperId: data.questionPaperId,

    qusNo: normalizeOptionalQuestionNumber(data.qusNo),

    point: normalizeOptionalPoint(data.point),

    isActive: normalizeIsActive(data.isActive),

    descriptionBN: data.descriptionBN,

    descriptionEng: data.descriptionEng,

    quesUddipok: normalizeOptionalText(data.quesUddipok),

    imageUrl: normalizeOptionalText(data.imageUrl),

    // ক

    quesKaBN: normalizeRequiredText(data.quesKaBN, "quesKaBN"),

    quesKaEng: normalizeRequiredText(data.quesKaEng, "quesKaEng"),

    quesKaLinkType: kaLink!.type,

    quesKaLinkId: kaLink!.id,

    ansKaBN: normalizeOptionalText(data.ansKaBN),

    ansKaEng: normalizeOptionalText(data.ansKaEng),

    // খ

    quesKhaBN: normalizeRequiredText(data.quesKhaBN, "quesKhaBN"),

    quesKhaEng: normalizeRequiredText(data.quesKhaEng, "quesKhaEng"),

    quesKhaLinkType: khaLink!.type,

    quesKhaLinkId: khaLink!.id,

    ansKhaBN: normalizeOptionalText(data.ansKhaBN),

    ansKhaEng: normalizeOptionalText(data.ansKhaEng),

    // গ

    quesGaBN: normalizeRequiredText(data.quesGaBN, "quesGaBN"),

    quesGaEng: normalizeRequiredText(data.quesGaEng, "quesGaEng"),

    quesGaLinkType: gaLink!.type,

    quesGaLinkId: gaLink!.id,

    ansGaBN: normalizeOptionalText(data.ansGaBN),

    ansGaEng: normalizeOptionalText(data.ansGaEng),

    // ঘ — optional

    quesGhaBN: hasGhaQuestion ? normalizedGhaBN : null,

    quesGhaEng: hasGhaQuestion ? normalizedGhaEng : null,

    quesGhaLinkType: hasGhaQuestion ? (normalizedGhaLink?.type ?? null) : null,

    quesGhaLinkId: hasGhaQuestion ? (normalizedGhaLink?.id ?? null) : null,

    ansGhaBN: hasGhaQuestion ? normalizeOptionalText(data.ansGhaBN) : null,

    ansGhaEng: hasGhaQuestion ? normalizeOptionalText(data.ansGhaEng) : null,
  };
}

async function validateQuestionPaper(questionPaperId: string): Promise<{
  id: string;
  subjectId: string;
}> {
  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id: questionPaperId,
  });

  if (!questionPaper) {
    throw new Error("Question Paper not found");
  }

  return {
    id: questionPaper.id,

    subjectId: questionPaper.subjectId,
  };
}

async function validateQuestionNumber(
  questionPaperId: string,
  qusNo: number | null,
  currentCQId?: string,
): Promise<void> {
  if (qusNo === null) {
    return;
  }

  const existing = await prisma.orm.public.CQ.first({
    questionPaperId,

    qusNo,
  });

  if (existing && existing.id !== currentCQId) {
    throw new Error(
      `Question number ${qusNo} already exists in this Question Paper`,
    );
  }
}

function sortCQsByQuestionNumber<
  T extends {
    id: string;
    qusNo: number | null;
  },
>(cqs: T[]): T[] {
  return [...cqs].sort((a, b) => {
    if (a.qusNo !== null && b.qusNo === null) {
      return -1;
    }

    if (a.qusNo === null && b.qusNo !== null) {
      return 1;
    }

    if (a.qusNo === null && b.qusNo === null) {
      return a.id.localeCompare(b.id);
    }

    return (a.qusNo as number) - (b.qusNo as number);
  });
}

/**
 * ORM JSON values use a generated JSON type that is not
 * identical to our local JsonValue type.
 *
 * This conversion is only at the service boundary.
 */
function normalizeExistingJson(value: unknown): JsonValue {
  return value as JsonValue;
}

function mergeCQData(
  existingCQ: {
    questionPaperId: string;
    qusNo: number | null;
    point: number | null;
    isActive: boolean;
    descriptionBN: unknown;
    descriptionEng: unknown;
    quesUddipok: string | null;
    imageUrl: string | null;

    // ক

    quesKaBN: string;
    quesKaEng: string;
    quesKaLinkType: string | null;
    quesKaLinkId: string | null;
    ansKaBN: string | null;
    ansKaEng: string | null;

    // খ

    quesKhaBN: string;
    quesKhaEng: string;
    quesKhaLinkType: string | null;
    quesKhaLinkId: string | null;
    ansKhaBN: string | null;
    ansKhaEng: string | null;

    // গ

    quesGaBN: string;
    quesGaEng: string;
    quesGaLinkType: string | null;
    quesGaLinkId: string | null;
    ansGaBN: string | null;
    ansGaEng: string | null;

    // ঘ

    quesGhaBN: string | null;
    quesGhaEng: string | null;
    quesGhaLinkType: string | null;
    quesGhaLinkId: string | null;
    ansGhaBN: string | null;
    ansGhaEng: string | null;
  },
  data: UpdateCQInput,
): MergedCQInput {
  return {
    questionPaperId: data.questionPaperId ?? existingCQ.questionPaperId,

    qusNo: data.qusNo !== undefined ? data.qusNo : existingCQ.qusNo,

    point: data.point !== undefined ? data.point : existingCQ.point,

    isActive: data.isActive !== undefined ? data.isActive : existingCQ.isActive,

    descriptionBN:
      data.descriptionBN !== undefined
        ? data.descriptionBN
        : normalizeExistingJson(existingCQ.descriptionBN),

    descriptionEng:
      data.descriptionEng !== undefined
        ? data.descriptionEng
        : normalizeExistingJson(existingCQ.descriptionEng),

    quesUddipok:
      data.quesUddipok !== undefined
        ? data.quesUddipok
        : existingCQ.quesUddipok,

    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existingCQ.imageUrl,

    // ক

    quesKaBN: data.quesKaBN !== undefined ? data.quesKaBN : existingCQ.quesKaBN,

    quesKaEng:
      data.quesKaEng !== undefined ? data.quesKaEng : existingCQ.quesKaEng,

    quesKaLinkType:
      data.quesKaLinkType !== undefined
        ? data.quesKaLinkType
        : existingCQ.quesKaLinkType,

    quesKaLinkId:
      data.quesKaLinkId !== undefined
        ? data.quesKaLinkId
        : existingCQ.quesKaLinkId,

    ansKaBN: data.ansKaBN !== undefined ? data.ansKaBN : existingCQ.ansKaBN,

    ansKaEng: data.ansKaEng !== undefined ? data.ansKaEng : existingCQ.ansKaEng,

    // খ

    quesKhaBN:
      data.quesKhaBN !== undefined ? data.quesKhaBN : existingCQ.quesKhaBN,

    quesKhaEng:
      data.quesKhaEng !== undefined ? data.quesKhaEng : existingCQ.quesKhaEng,

    quesKhaLinkType:
      data.quesKhaLinkType !== undefined
        ? data.quesKhaLinkType
        : existingCQ.quesKhaLinkType,

    quesKhaLinkId:
      data.quesKhaLinkId !== undefined
        ? data.quesKhaLinkId
        : existingCQ.quesKhaLinkId,

    ansKhaBN: data.ansKhaBN !== undefined ? data.ansKhaBN : existingCQ.ansKhaBN,

    ansKhaEng:
      data.ansKhaEng !== undefined ? data.ansKhaEng : existingCQ.ansKhaEng,

    // গ

    quesGaBN: data.quesGaBN !== undefined ? data.quesGaBN : existingCQ.quesGaBN,

    quesGaEng:
      data.quesGaEng !== undefined ? data.quesGaEng : existingCQ.quesGaEng,

    quesGaLinkType:
      data.quesGaLinkType !== undefined
        ? data.quesGaLinkType
        : existingCQ.quesGaLinkType,

    quesGaLinkId:
      data.quesGaLinkId !== undefined
        ? data.quesGaLinkId
        : existingCQ.quesGaLinkId,

    ansGaBN: data.ansGaBN !== undefined ? data.ansGaBN : existingCQ.ansGaBN,

    ansGaEng: data.ansGaEng !== undefined ? data.ansGaEng : existingCQ.ansGaEng,

    // ঘ

    quesGhaBN:
      data.quesGhaBN !== undefined ? data.quesGhaBN : existingCQ.quesGhaBN,

    quesGhaEng:
      data.quesGhaEng !== undefined ? data.quesGhaEng : existingCQ.quesGhaEng,

    quesGhaLinkType:
      data.quesGhaLinkType !== undefined
        ? data.quesGhaLinkType
        : existingCQ.quesGhaLinkType,

    quesGhaLinkId:
      data.quesGhaLinkId !== undefined
        ? data.quesGhaLinkId
        : existingCQ.quesGhaLinkId,

    ansGhaBN: data.ansGhaBN !== undefined ? data.ansGhaBN : existingCQ.ansGhaBN,

    ansGhaEng:
      data.ansGhaEng !== undefined ? data.ansGhaEng : existingCQ.ansGhaEng,
  };
}

async function validateNormalizedCQ(
  questionPaperSubjectId: string,
  normalizedData: NormalizedCQData,
): Promise<void> {
  await validateAllKnowledgeLinks(questionPaperSubjectId, [
    {
      fieldName: "quesKa",
      link: {
        type: normalizedData.quesKaLinkType,
        id: normalizedData.quesKaLinkId,
      },
    },

    {
      fieldName: "quesKha",
      link: {
        type: normalizedData.quesKhaLinkType,
        id: normalizedData.quesKhaLinkId,
      },
    },

    {
      fieldName: "quesGa",
      link: {
        type: normalizedData.quesGaLinkType,
        id: normalizedData.quesGaLinkId,
      },
    },

    {
      fieldName: "quesGha",

      link:
        normalizedData.quesGhaLinkId !== null &&
        normalizedData.quesGhaLinkType !== null
          ? {
              type: normalizedData.quesGhaLinkType,
              id: normalizedData.quesGhaLinkId,
            }
          : null,
    },
  ]);
}

/**
 * Create one CQ.
 *
 * This remains the normal single-CQ creation function.
 */
export async function createCQ(data: CreateCQInput) {
  const questionPaper = await validateQuestionPaper(data.questionPaperId);

  const normalizedData = normalizeData(data);

  await validateQuestionNumber(data.questionPaperId, normalizedData.qusNo);

  await validateNormalizedCQ(questionPaper.subjectId, normalizedData);

  return prisma.orm.public.CQ.create({
    questionPaperId: normalizedData.questionPaperId,

    qusNo: normalizedData.qusNo,

    point: normalizedData.point,

    isActive: normalizedData.isActive,

    descriptionBN: normalizedData.descriptionBN as any,

    descriptionEng: normalizedData.descriptionEng as any,

    quesUddipok: normalizedData.quesUddipok,

    imageUrl: normalizedData.imageUrl,

    // ক

    quesKaBN: normalizedData.quesKaBN,

    quesKaEng: normalizedData.quesKaEng,

    quesKaLinkType: normalizedData.quesKaLinkType,

    quesKaLinkId: normalizedData.quesKaLinkId,

    ansKaBN: normalizedData.ansKaBN,

    ansKaEng: normalizedData.ansKaEng,

    // খ

    quesKhaBN: normalizedData.quesKhaBN,

    quesKhaEng: normalizedData.quesKhaEng,

    quesKhaLinkType: normalizedData.quesKhaLinkType,

    quesKhaLinkId: normalizedData.quesKhaLinkId,

    ansKhaBN: normalizedData.ansKhaBN,

    ansKhaEng: normalizedData.ansKhaEng,

    // গ

    quesGaBN: normalizedData.quesGaBN,

    quesGaEng: normalizedData.quesGaEng,

    quesGaLinkType: normalizedData.quesGaLinkType,

    quesGaLinkId: normalizedData.quesGaLinkId,

    ansGaBN: normalizedData.ansGaBN,

    ansGaEng: normalizedData.ansGaEng,

    // ঘ — optional

    quesGhaBN: normalizedData.quesGhaBN,

    quesGhaEng: normalizedData.quesGhaEng,

    quesGhaLinkType: normalizedData.quesGhaLinkType,

    quesGhaLinkId: normalizedData.quesGhaLinkId,

    ansGhaBN: normalizedData.ansGhaBN,

    ansGhaEng: normalizedData.ansGhaEng,
  });
}

/**
 * Create multiple CQs for one or more Question Papers.
 *
 * The same validation used by createCQ() is applied to every CQ.
 *
 * This function is intentionally kept separate from createCQ()
 * so the existing single-CQ admin flow continues to work.
 *
 * Before creating anything, duplicate question numbers inside
 * the same Question Paper are detected.
 */
export async function createCQs(data: CreateCQInput[]) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("At least one CQ is required");
  }

  /**
   * Detect duplicate question numbers inside the incoming batch
   * before any database rows are created.
   *
   * This prevents a batch such as:
   *
   * CQ 1 -> qusNo 1
   * CQ 2 -> qusNo 1
   *
   * from partially creating the batch.
   */
  const questionNumbers = new Map<string, Set<number>>();

  for (const item of data) {
    const normalizedQuestionNumber = normalizeOptionalQuestionNumber(
      item.qusNo,
    );

    if (normalizedQuestionNumber === null) {
      continue;
    }

    let paperNumbers = questionNumbers.get(item.questionPaperId);

    if (!paperNumbers) {
      paperNumbers = new Set<number>();

      questionNumbers.set(item.questionPaperId, paperNumbers);
    }

    if (paperNumbers.has(normalizedQuestionNumber)) {
      throw new Error(
        `Question number ${normalizedQuestionNumber} appears more than once in the same Question Paper`,
      );
    }

    paperNumbers.add(normalizedQuestionNumber);
  }

  /**
   * Create sequentially.
   *
   * We deliberately reuse createCQ() so that bulk creation
   * follows exactly the same validation and database mapping
   * as single-CQ creation.
   */
  const createdCQs = [];

  for (const item of data) {
    const cq = await createCQ(item);

    createdCQs.push(cq);
  }

  return sortCQsByQuestionNumber(createdCQs);
}

export async function getCQs(questionPaperId?: string) {
  if (questionPaperId !== undefined) {
    const cqs = await prisma.orm.public.CQ.where({
      questionPaperId,
    }).all();

    return sortCQsByQuestionNumber(cqs);
  }

  return prisma.orm.public.CQ.orderBy((cq) => cq.id.desc()).all();
}

export async function getCQ(id: string) {
  return prisma.orm.public.CQ.first({
    id,
  });
}

export async function updateCQ(id: string, data: UpdateCQInput) {
  const existingCQ = await prisma.orm.public.CQ.first({
    id,
  });

  if (!existingCQ) {
    return null;
  }

  const mergedData = mergeCQData(existingCQ, data);

  const questionPaper = await validateQuestionPaper(mergedData.questionPaperId);

  const normalizedData = normalizeData(mergedData);

  await validateQuestionNumber(
    normalizedData.questionPaperId,
    normalizedData.qusNo,
    id,
  );

  await validateNormalizedCQ(questionPaper.subjectId, normalizedData);

  return prisma.orm.public.CQ.where({ id }).update({
    questionPaperId: normalizedData.questionPaperId,

    qusNo: normalizedData.qusNo,

    point: normalizedData.point,

    isActive: normalizedData.isActive,

    descriptionBN: normalizedData.descriptionBN as any,

    descriptionEng: normalizedData.descriptionEng as any,

    quesUddipok: normalizedData.quesUddipok,

    imageUrl: normalizedData.imageUrl,

    // ক

    quesKaBN: normalizedData.quesKaBN,

    quesKaEng: normalizedData.quesKaEng,

    quesKaLinkType: normalizedData.quesKaLinkType,

    quesKaLinkId: normalizedData.quesKaLinkId,

    ansKaBN: normalizedData.ansKaBN,

    ansKaEng: normalizedData.ansKaEng,

    // খ

    quesKhaBN: normalizedData.quesKhaBN,

    quesKhaEng: normalizedData.quesKhaEng,

    quesKhaLinkType: normalizedData.quesKhaLinkType,

    quesKhaLinkId: normalizedData.quesKhaLinkId,

    ansKhaBN: normalizedData.ansKhaBN,

    ansKhaEng: normalizedData.ansKhaEng,

    // গ

    quesGaBN: normalizedData.quesGaBN,

    quesGaEng: normalizedData.quesGaEng,

    quesGaLinkType: normalizedData.quesGaLinkType,

    quesGaLinkId: normalizedData.quesGaLinkId,

    ansGaBN: normalizedData.ansGaBN,

    ansGaEng: normalizedData.ansGaEng,

    // ঘ — optional

    quesGhaBN: normalizedData.quesGhaBN,

    quesGhaEng: normalizedData.quesGhaEng,

    quesGhaLinkType: normalizedData.quesGhaLinkType,

    quesGhaLinkId: normalizedData.quesGhaLinkId,

    ansGhaBN: normalizedData.ansGhaBN,

    ansGhaEng: normalizedData.ansGhaEng,
  });
}

export async function deleteCQ(id: string) {
  const existingCQ = await prisma.orm.public.CQ.first({
    id,
  });

  if (!existingCQ) {
    return null;
  }

  return prisma.orm.public.CQ.where({ id }).delete();
}

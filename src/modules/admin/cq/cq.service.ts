import { prisma } from "./../../../config/prisma.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

export type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

export interface KnowledgeLinkInput {
  linkType?: KnowledgeLinkType | null;

  linkId?: number | null;
}

/**

 * Data required when creating a CQ.

 *

 * qusNo and point are optional.
 * New CQs are inactive by default; isActive can be explicitly set.

 *

 * Ka, Kha and Ga must always have a chapter ID.

 *

 * Gha is optional.

 */

export interface CreateCQInput {
  questionPaperId: number;

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

  quesKaLinkId?: number | null;

  ansKaBN?: string | null;

  ansKaEng?: string | null;

  // খ

  quesKhaBN: string;

  quesKhaEng: string;

  quesKhaLinkType?: KnowledgeLinkType | null;

  quesKhaLinkId?: number | null;

  ansKhaBN?: string | null;

  ansKhaEng?: string | null;

  // গ

  quesGaBN: string;

  quesGaEng: string;

  quesGaLinkType?: KnowledgeLinkType | null;

  quesGaLinkId?: number | null;

  ansGaBN?: string | null;

  ansGaEng?: string | null;

  // ঘ — optional

  quesGhaBN?: string | null;

  quesGhaEng?: string | null;

  quesGhaLinkType?: KnowledgeLinkType | null;

  quesGhaLinkId?: number | null;

  ansGhaBN?: string | null;

  ansGhaEng?: string | null;
}

/**

 * Partial update.

 *

 * undefined = do not change.

 * null = clear a nullable field.
 * isActive = true/false controls this CQ independently.

 */

export type UpdateCQInput = Partial<CreateCQInput>;

interface NormalizedLink {
  type: "CHAPTER";

  id: number;
}

interface NormalizedCQData {
  questionPaperId: number;

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

  quesKaLinkType: "CHAPTER";

  quesKaLinkId: number;

  ansKaBN: string | null;

  ansKaEng: string | null;

  // খ

  quesKhaBN: string;

  quesKhaEng: string;

  quesKhaLinkType: "CHAPTER";

  quesKhaLinkId: number;

  ansKhaBN: string | null;

  ansKhaEng: string | null;

  // গ

  quesGaBN: string;

  quesGaEng: string;

  quesGaLinkType: "CHAPTER";

  quesGaLinkId: number;

  ansGaBN: string | null;

  ansGaEng: string | null;

  // ঘ — optional

  quesGhaBN: string | null;

  quesGhaEng: string | null;

  quesGhaLinkType: "CHAPTER" | null;

  quesGhaLinkId: number | null;

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
  questionPaperId: number;

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

  quesKaLinkId: number | null;

  ansKaBN: string | null;

  ansKaEng: string | null;

  // খ

  quesKhaBN: string;

  quesKhaEng: string;

  quesKhaLinkType: string | null;

  quesKhaLinkId: number | null;

  ansKhaBN: string | null;

  ansKhaEng: string | null;

  // গ

  quesGaBN: string;

  quesGaEng: string;

  quesGaLinkType: string | null;

  quesGaLinkId: number | null;

  ansGaBN: string | null;

  ansGaEng: string | null;

  // ঘ

  quesGhaBN: string | null;

  quesGhaEng: string | null;

  quesGhaLinkType: string | null;

  quesGhaLinkId: number | null;

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

 * Ka / Kha / Ga must always point to a Chapter.

 */

function normalizeRequiredChapterLink(
  linkType: KnowledgeLinkType | string | null | undefined,

  linkId: number | null | undefined,

  fieldName: string,
): NormalizedLink {
  if (linkId === undefined || linkId === null) {
    throw new Error(`${fieldName} chapter ID is required`);
  }

  if (!Number.isInteger(linkId) || linkId <= 0) {
    throw new Error(`${fieldName} chapter ID must be a positive integer`);
  }

  const normalizedType = normalizeLinkType(linkType);

  if (normalizedType !== null && normalizedType !== "CHAPTER") {
    throw new Error(`${fieldName} must be linked to a CHAPTER`);
  }

  return {
    type: "CHAPTER",

    id: linkId,
  };
}

/**

 * Gha is optional.

 *

 * If Gha has question text, it must have a chapter.

 */

function normalizeOptionalGhaLink(
  linkType: KnowledgeLinkType | string | null | undefined,

  linkId: number | null | undefined,
): NormalizedLink | null {
  if (linkType === undefined && linkId === undefined) {
    return null;
  }

  if (linkType === null && linkId === null) {
    return null;
  }

  if (linkId === undefined || linkId === null) {
    throw new Error("quesGhaLinkId is required when Gha is provided");
  }

  if (!Number.isInteger(linkId) || linkId <= 0) {
    throw new Error("quesGhaLinkId must be a positive integer");
  }

  const normalizedType = normalizeLinkType(linkType);

  if (normalizedType !== null && normalizedType !== "CHAPTER") {
    throw new Error("Gha must be linked to a CHAPTER");
  }

  return {
    type: "CHAPTER",

    id: linkId,
  };
}

async function validateChapter(
  questionPaperSubjectId: number,

  chapterId: number,

  fieldName: string,
): Promise<void> {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    throw new Error(`${fieldName} chapter with ID ${chapterId} was not found`);
  }

  if (chapter.subjectId !== questionPaperSubjectId) {
    throw new Error(
      `${fieldName} chapter with ID ${chapterId} does not belong to the Question Paper subject`,
    );
  }
}

async function validateAllChapterLinks(
  questionPaperSubjectId: number,

  links: Array<{
    fieldName: string;

    link: NormalizedLink | null;
  }>,
): Promise<void> {
  for (const item of links) {
    if (!item.link) {
      continue;
    }

    await validateChapter(questionPaperSubjectId, item.link.id, item.fieldName);
  }
}

function normalizeData(data: MergedCQInput | CreateCQInput): NormalizedCQData {
  const kaLink = normalizeRequiredChapterLink(
    data.quesKaLinkType,

    data.quesKaLinkId,

    "quesKa",
  );

  const khaLink = normalizeRequiredChapterLink(
    data.quesKhaLinkType,

    data.quesKhaLinkId,

    "quesKha",
  );

  const gaLink = normalizeRequiredChapterLink(
    data.quesGaLinkType,

    data.quesGaLinkId,

    "quesGa",
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
      "Gha question must be provided before Gha answer or chapter link",
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

    quesKaLinkType: kaLink.type,

    quesKaLinkId: kaLink.id,

    ansKaBN: normalizeOptionalText(data.ansKaBN),

    ansKaEng: normalizeOptionalText(data.ansKaEng),

    // খ

    quesKhaBN: normalizeRequiredText(data.quesKhaBN, "quesKhaBN"),

    quesKhaEng: normalizeRequiredText(data.quesKhaEng, "quesKhaEng"),

    quesKhaLinkType: khaLink.type,

    quesKhaLinkId: khaLink.id,

    ansKhaBN: normalizeOptionalText(data.ansKhaBN),

    ansKhaEng: normalizeOptionalText(data.ansKhaEng),

    // গ

    quesGaBN: normalizeRequiredText(data.quesGaBN, "quesGaBN"),

    quesGaEng: normalizeRequiredText(data.quesGaEng, "quesGaEng"),

    quesGaLinkType: gaLink.type,

    quesGaLinkId: gaLink.id,

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

async function validateQuestionPaper(questionPaperId: number): Promise<{
  id: number;

  subjectId: number;
}> {
  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id: questionPaperId,
  });

  if (!questionPaper) {
    throw new Error("Question Paper not found");
  }

  if (questionPaper.questionType !== "CQ") {
    throw new Error("The selected Question Paper is not a CQ Question Paper");
  }

  return {
    id: questionPaper.id,

    subjectId: questionPaper.subjectId,
  };
}

async function validateQuestionNumber(
  questionPaperId: number,

  qusNo: number | null,

  currentCQId?: number,
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
    id: number;

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
      return a.id - b.id;
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
    questionPaperId: number;

    qusNo: number | null;

    point: number | null;
    isActive: boolean;

    descriptionBN: unknown;

    descriptionEng: unknown;

    quesUddipok: string | null;

    imageUrl: string | null;

    quesKaBN: string;

    quesKaEng: string;

    quesKaLinkType: string | null;

    quesKaLinkId: number | null;

    ansKaBN: string | null;

    ansKaEng: string | null;

    quesKhaBN: string;

    quesKhaEng: string;

    quesKhaLinkType: string | null;

    quesKhaLinkId: number | null;

    ansKhaBN: string | null;

    ansKhaEng: string | null;

    quesGaBN: string;

    quesGaEng: string;

    quesGaLinkType: string | null;

    quesGaLinkId: number | null;

    ansGaBN: string | null;

    ansGaEng: string | null;

    quesGhaBN: string | null;

    quesGhaEng: string | null;

    quesGhaLinkType: string | null;

    quesGhaLinkId: number | null;

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
  questionPaperSubjectId: number,

  normalizedData: NormalizedCQData,
): Promise<void> {
  await validateAllChapterLinks(questionPaperSubjectId, [
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
        normalizedData.quesGhaLinkId !== null
          ? {
              type: "CHAPTER",

              id: normalizedData.quesGhaLinkId,
            }
          : null,
    },
  ]);
}

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

export async function getCQs(questionPaperId?: number) {
  if (questionPaperId !== undefined) {
    const cqs = await prisma.orm.public.CQ.where({
      questionPaperId,
    }).all();

    return sortCQsByQuestionNumber(cqs);
  }

  return prisma.orm.public.CQ.orderBy((cq) => cq.id.desc()).all();
}

export async function getCQ(id: number) {
  return prisma.orm.public.CQ.first({
    id,
  });
}

export async function updateCQ(id: number, data: UpdateCQInput) {
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

export async function deleteCQ(id: number) {
  const existingCQ = await prisma.orm.public.CQ.first({
    id,
  });

  if (!existingCQ) {
    return null;
  }

  return prisma.orm.public.CQ.where({ id }).delete();
}

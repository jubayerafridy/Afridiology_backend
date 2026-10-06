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
 * Data required when creating an MCQ.
 *
 * questionPaperId and qusNo are optional because the database
 * allows an MCQ to exist independently of a Question Paper.
 *
 * linkType + linkId are also optional. When supplied, both must
 * be supplied together and the target must exist in the
 * Chapter -> Lesson -> Concept -> Execution hierarchy.
 *
 * New MCQs are inactive by default.
 */
export interface CreateMCQInput {
  isActive?: boolean;

  imageUrl?: string | null;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;

  rightAns: number;

  explanationBN?: JsonValue | null;
  explanationEng?: JsonValue | null;

  linkId?: number | null;
  linkType?: KnowledgeLinkType | null;

  questionPaperId?: number | null;
  qusNo?: number | null;

  optionsBN: JsonValue;
  optionsEng: JsonValue;

  ytLink?: string | null;
}

/**
 * Partial update.
 *
 * undefined = do not change.
 * null = clear a nullable field.
 *
 * isActive controls the MCQ independently.
 */
export type UpdateMCQInput = Partial<CreateMCQInput>;

interface NormalizedMCQData {
  isActive: boolean;

  imageUrl: string | null;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;

  rightAns: number;

  explanationBN: JsonValue | null;
  explanationEng: JsonValue | null;

  linkId: number | null;
  linkType: KnowledgeLinkType | null;

  questionPaperId: number | null;
  qusNo: number | null;

  optionsBN: JsonValue;
  optionsEng: JsonValue;

  ytLink: string | null;
}

interface MergedMCQInput {
  isActive: boolean;

  imageUrl: string | null;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;

  rightAns: number;

  explanationBN: JsonValue | null;
  explanationEng: JsonValue | null;

  linkId: number | null;
  linkType: string | null;

  questionPaperId: number | null;
  qusNo: number | null;

  optionsBN: JsonValue;
  optionsEng: JsonValue;

  ytLink: string | null;
}

interface KnowledgeTarget {
  linkType: KnowledgeLinkType;
  linkId: number;
  subjectId: number;
}

function normalizeOptionalText(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
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

function normalizeOptionalQuestionNumber(value?: number | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Question number must be a positive integer");
  }

  return value;
}

function normalizeRightAnswer(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("rightAns must be a positive integer");
  }

  return value;
}

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

function normalizeLink(
  linkType: string | KnowledgeLinkType | null | undefined,
  linkId: number | null | undefined,
): {
  linkType: KnowledgeLinkType | null;
  linkId: number | null;
} {
  const normalizedType = normalizeLinkType(linkType);

  if (normalizedType === null && (linkId === undefined || linkId === null)) {
    return {
      linkType: null,
      linkId: null,
    };
  }

  if (normalizedType === null && linkId !== undefined && linkId !== null) {
    throw new Error("linkType is required when linkId is provided");
  }

  if (normalizedType !== null && (linkId === undefined || linkId === null)) {
    throw new Error("linkId is required when linkType is provided");
  }

  if (linkId === undefined || linkId === null) {
    throw new Error("linkId is required when linkType is provided");
  }

  if (!Number.isInteger(linkId) || linkId <= 0) {
    throw new Error("linkId must be a positive integer");
  }

  return {
    linkType: normalizedType,
    linkId,
  };
}

function normalizeJsonValue(
  value: JsonValue | null | undefined,
  fieldName: string,
): JsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isJsonValue(value)) {
    throw new Error(`${fieldName} must contain valid JSON`);
  }

  return value;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object") {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function normalizeRequiredJsonValue(
  value: JsonValue,
  fieldName: string,
): JsonValue {
  if (!isJsonValue(value)) {
    throw new Error(`${fieldName} is required and must contain valid JSON`);
  }

  return value;
}

function normalizeOptionalJsonValue(
  value: JsonValue | null | undefined,
  fieldName: string,
): JsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isJsonValue(value)) {
    throw new Error(`${fieldName} must contain valid JSON`);
  }

  return value;
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

  return {
    id: questionPaper.id,
    subjectId: questionPaper.subjectId,
  };
}

/**
 * Resolves an MCQ knowledge link to its actual subject.
 *
 * Hierarchy:
 *
 * Chapter
 *   ↓
 * Lesson
 *   ↓
 * Concept
 *   ↓
 * Execution
 *
 * Only the direct link is stored on the MCQ.
 * Ancestors are derived from the hierarchy.
 */
async function resolveKnowledgeTarget(
  linkType: KnowledgeLinkType,
  linkId: number,
): Promise<KnowledgeTarget> {
  if (linkType === "CHAPTER") {
    const chapter = await prisma.orm.public.Chapter.first({
      id: linkId,
    });

    if (!chapter) {
      throw new Error(`Chapter with ID ${linkId} was not found`);
    }

    return {
      linkType,
      linkId,
      subjectId: chapter.subjectId,
    };
  }

  if (linkType === "LESSON") {
    const lesson = await prisma.orm.public.Lesson.first({
      id: linkId,
    });

    if (!lesson) {
      throw new Error(`Lesson with ID ${linkId} was not found`);
    }

    const chapter = await prisma.orm.public.Chapter.first({
      id: lesson.chapterId,
    });

    if (!chapter) {
      throw new Error(
        `Chapter with ID ${lesson.chapterId} for Lesson ${linkId} was not found`,
      );
    }

    return {
      linkType,
      linkId,
      subjectId: chapter.subjectId,
    };
  }

  if (linkType === "CONCEPT") {
    const concept = await prisma.orm.public.Concept.first({
      id: linkId,
    });

    if (!concept) {
      throw new Error(`Concept with ID ${linkId} was not found`);
    }

    const lesson = await prisma.orm.public.Lesson.first({
      id: concept.lessonId,
    });

    if (!lesson) {
      throw new Error(
        `Lesson with ID ${concept.lessonId} for Concept ${linkId} was not found`,
      );
    }

    const chapter = await prisma.orm.public.Chapter.first({
      id: lesson.chapterId,
    });

    if (!chapter) {
      throw new Error(
        `Chapter with ID ${lesson.chapterId} for Concept ${linkId} was not found`,
      );
    }

    return {
      linkType,
      linkId,
      subjectId: chapter.subjectId,
    };
  }

  const execution = await prisma.orm.public.Execution.first({
    id: linkId,
  });

  if (!execution) {
    throw new Error(`Execution with ID ${linkId} was not found`);
  }

  const concept = await prisma.orm.public.Concept.first({
    id: execution.conceptId,
  });

  if (!concept) {
    throw new Error(
      `Concept with ID ${execution.conceptId} for Execution ${linkId} was not found`,
    );
  }

  const lesson = await prisma.orm.public.Lesson.first({
    id: concept.lessonId,
  });

  if (!lesson) {
    throw new Error(
      `Lesson with ID ${concept.lessonId} for Execution ${linkId} was not found`,
    );
  }

  const chapter = await prisma.orm.public.Chapter.first({
    id: lesson.chapterId,
  });

  if (!chapter) {
    throw new Error(
      `Chapter with ID ${lesson.chapterId} for Execution ${linkId} was not found`,
    );
  }

  return {
    linkType,
    linkId,
    subjectId: chapter.subjectId,
  };
}

async function validateKnowledgeLink(
  linkType: KnowledgeLinkType | null,
  linkId: number | null,
  questionPaperSubjectId?: number,
): Promise<void> {
  if (linkType === null && linkId === null) {
    return;
  }

  if (linkType === null || linkId === null) {
    throw new Error("linkType and linkId must be provided together");
  }

  const target = await resolveKnowledgeTarget(linkType, linkId);

  if (
    questionPaperSubjectId !== undefined &&
    target.subjectId !== questionPaperSubjectId
  ) {
    throw new Error(
      `The ${linkType.toLowerCase()} with ID ${linkId} does not belong to the Question Paper subject`,
    );
  }
}

async function validateQuestionNumber(
  questionPaperId: number | null,
  qusNo: number | null,
  currentMCQId?: number,
): Promise<void> {
  if (qusNo === null) {
    return;
  }

  if (questionPaperId === null) {
    throw new Error("questionPaperId is required when qusNo is provided");
  }

  const existing = await prisma.orm.public.MCQ.first({
    questionPaperId,
    qusNo,
  });

  if (existing && existing.id !== currentMCQId) {
    throw new Error(
      `Question number ${qusNo} already exists in this Question Paper`,
    );
  }
}

function sortMCQsByQuestionNumber<
  T extends {
    id: number;
    qusNo: number | null;
  },
>(mcqs: T[]): T[] {
  return [...mcqs].sort((a, b) => {
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

function normalizeData(
  data: MergedMCQInput | CreateMCQInput,
): NormalizedMCQData {
  const link = normalizeLink(data.linkType, data.linkId);

  const questionPaperId =
    data.questionPaperId === undefined || data.questionPaperId === null
      ? null
      : data.questionPaperId;

  const qusNo = normalizeOptionalQuestionNumber(data.qusNo);

  if (qusNo !== null && questionPaperId === null) {
    throw new Error("questionPaperId is required when qusNo is provided");
  }

  return {
    isActive: normalizeIsActive(data.isActive),

    imageUrl: normalizeOptionalText(data.imageUrl),

    descriptionBN: normalizeRequiredJsonValue(
      data.descriptionBN,
      "descriptionBN",
    ),

    descriptionEng: normalizeRequiredJsonValue(
      data.descriptionEng,
      "descriptionEng",
    ),

    rightAns: normalizeRightAnswer(data.rightAns),

    explanationBN: normalizeOptionalJsonValue(
      data.explanationBN,
      "explanationBN",
    ),

    explanationEng: normalizeOptionalJsonValue(
      data.explanationEng,
      "explanationEng",
    ),

    linkId: link.linkId,
    linkType: link.linkType,

    questionPaperId,
    qusNo,

    optionsBN: normalizeRequiredJsonValue(data.optionsBN, "optionsBN"),

    optionsEng: normalizeRequiredJsonValue(data.optionsEng, "optionsEng"),

    ytLink: normalizeOptionalText(data.ytLink),
  };
}

function normalizeExistingJson(value: unknown): JsonValue {
  return value as JsonValue;
}

function mergeMCQData(
  existingMCQ: {
    isActive: boolean;

    imageUrl: string | null;

    descriptionBN: unknown;
    descriptionEng: unknown;

    rightAns: number;

    explanationBN: unknown;
    explanationEng: unknown;

    linkId: number | null;
    linkType: string | null;

    questionPaperId: number | null;
    qusNo: number | null;

    optionsBN: unknown;
    optionsEng: unknown;

    ytLink: string | null;
  },
  data: UpdateMCQInput,
): MergedMCQInput {
  const linkType =
    data.linkType !== undefined ? data.linkType : existingMCQ.linkType;

  const linkId = data.linkId !== undefined ? data.linkId : existingMCQ.linkId;

  return {
    isActive:
      data.isActive !== undefined ? data.isActive : existingMCQ.isActive,

    imageUrl:
      data.imageUrl !== undefined ? data.imageUrl : existingMCQ.imageUrl,

    descriptionBN:
      data.descriptionBN !== undefined
        ? data.descriptionBN
        : normalizeExistingJson(existingMCQ.descriptionBN),

    descriptionEng:
      data.descriptionEng !== undefined
        ? data.descriptionEng
        : normalizeExistingJson(existingMCQ.descriptionEng),

    rightAns:
      data.rightAns !== undefined ? data.rightAns : existingMCQ.rightAns,

    explanationBN:
      data.explanationBN !== undefined
        ? data.explanationBN
        : existingMCQ.explanationBN === null
          ? null
          : normalizeExistingJson(existingMCQ.explanationBN),

    explanationEng:
      data.explanationEng !== undefined
        ? data.explanationEng
        : existingMCQ.explanationEng === null
          ? null
          : normalizeExistingJson(existingMCQ.explanationEng),

    linkId,
    linkType,

    questionPaperId:
      data.questionPaperId !== undefined
        ? data.questionPaperId
        : existingMCQ.questionPaperId,

    qusNo: data.qusNo !== undefined ? data.qusNo : existingMCQ.qusNo,

    optionsBN:
      data.optionsBN !== undefined
        ? data.optionsBN
        : normalizeExistingJson(existingMCQ.optionsBN),

    optionsEng:
      data.optionsEng !== undefined
        ? data.optionsEng
        : normalizeExistingJson(existingMCQ.optionsEng),

    ytLink: data.ytLink !== undefined ? data.ytLink : existingMCQ.ytLink,
  };
}

async function validateNormalizedMCQ(
  normalizedData: NormalizedMCQData,
  questionPaperSubjectId?: number,
): Promise<void> {
  await validateKnowledgeLink(
    normalizedData.linkType,
    normalizedData.linkId,
    questionPaperSubjectId,
  );
}

export async function createMCQ(data: CreateMCQInput) {
  let questionPaperSubjectId: number | undefined;

  if (data.questionPaperId !== undefined && data.questionPaperId !== null) {
    const questionPaper = await validateQuestionPaper(data.questionPaperId);

    questionPaperSubjectId = questionPaper.subjectId;
  }

  const normalizedData = normalizeData(data);

  await validateQuestionNumber(
    normalizedData.questionPaperId,
    normalizedData.qusNo,
  );

  await validateNormalizedMCQ(normalizedData, questionPaperSubjectId);

  return prisma.orm.public.MCQ.create({
    isActive: normalizedData.isActive,

    imageUrl: normalizedData.imageUrl,

    descriptionBN: normalizedData.descriptionBN as any,
    descriptionEng: normalizedData.descriptionEng as any,

    rightAns: normalizedData.rightAns,

    explanationBN: normalizedData.explanationBN as any,
    explanationEng: normalizedData.explanationEng as any,

    linkId: normalizedData.linkId,
    linkType: normalizedData.linkType,

    questionPaperId: normalizedData.questionPaperId,
    qusNo: normalizedData.qusNo,

    optionsBN: normalizedData.optionsBN as any,
    optionsEng: normalizedData.optionsEng as any,

    ytLink: normalizedData.ytLink,
  });
}

export async function getMCQs(questionPaperId?: number) {
  if (questionPaperId !== undefined) {
    const mcqs = await prisma.orm.public.MCQ.where({
      questionPaperId,
    }).all();

    return sortMCQsByQuestionNumber(mcqs);
  }

  return prisma.orm.public.MCQ.orderBy((mcq) => mcq.id.desc()).all();
}

export async function getMCQ(id: number) {
  return prisma.orm.public.MCQ.first({
    id,
  });
}

export async function updateMCQ(id: number, data: UpdateMCQInput) {
  const existingMCQ = await prisma.orm.public.MCQ.first({
    id,
  });

  if (!existingMCQ) {
    return null;
  }

  const mergedData = mergeMCQData(existingMCQ, data);

  let questionPaperSubjectId: number | undefined;

  if (
    mergedData.questionPaperId !== undefined &&
    mergedData.questionPaperId !== null
  ) {
    const questionPaper = await validateQuestionPaper(
      mergedData.questionPaperId,
    );

    questionPaperSubjectId = questionPaper.subjectId;
  }

  const normalizedData = normalizeData(mergedData);

  await validateQuestionNumber(
    normalizedData.questionPaperId,
    normalizedData.qusNo,
    id,
  );

  await validateNormalizedMCQ(normalizedData, questionPaperSubjectId);

  return prisma.orm.public.MCQ.where({ id }).update({
    isActive: normalizedData.isActive,

    imageUrl: normalizedData.imageUrl,

    descriptionBN: normalizedData.descriptionBN as any,
    descriptionEng: normalizedData.descriptionEng as any,

    rightAns: normalizedData.rightAns,

    explanationBN: normalizedData.explanationBN as any,
    explanationEng: normalizedData.explanationEng as any,

    linkId: normalizedData.linkId,
    linkType: normalizedData.linkType,

    questionPaperId: normalizedData.questionPaperId,
    qusNo: normalizedData.qusNo,

    optionsBN: normalizedData.optionsBN as any,
    optionsEng: normalizedData.optionsEng as any,

    ytLink: normalizedData.ytLink,
  });
}

export async function deleteMCQ(id: number) {
  const existingMCQ = await prisma.orm.public.MCQ.first({
    id,
  });

  if (!existingMCQ) {
    return null;
  }

  return prisma.orm.public.MCQ.where({ id }).delete();
}

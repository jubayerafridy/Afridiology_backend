import { prisma } from "../../../config/prisma.js";

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

export interface CreateCQInput {
  questionPaperId: number;
  qusNo: number;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;

  quesUddipok?: string | null;
  imageUrl?: string | null;

  quesKaBN: string;
  quesKaEng: string;
  quesKaLinkType?: KnowledgeLinkType | null;
  quesKaLinkId?: number | null;
  ansKaBN?: string | null;
  ansKaEng?: string | null;

  quesKhaBN: string;
  quesKhaEng: string;
  quesKhaLinkType?: KnowledgeLinkType | null;
  quesKhaLinkId?: number | null;
  ansKhaBN?: string | null;
  ansKhaEng?: string | null;

  quesGaBN: string;
  quesGaEng: string;
  quesGaLinkType?: KnowledgeLinkType | null;
  quesGaLinkId?: number | null;
  ansGaBN?: string | null;
  ansGaEng?: string | null;

  quesGhaBN: string;
  quesGhaEng: string;
  quesGhaLinkType?: KnowledgeLinkType | null;
  quesGhaLinkId?: number | null;
  ansGhaBN?: string | null;
  ansGhaEng?: string | null;
}

export type UpdateCQInput = Omit<CreateCQInput, "questionPaperId"> & {
  questionPaperId: number;
};

interface NormalizedLink {
  type: KnowledgeLinkType | null;
  id: number | null;
}

interface NormalizedCQData {
  questionPaperId: number;
  qusNo: number;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;

  quesUddipok: string | null;
  imageUrl: string | null;

  quesKaBN: string;
  quesKaEng: string;
  quesKaLinkType: KnowledgeLinkType | null;
  quesKaLinkId: number | null;
  ansKaBN: string | null;
  ansKaEng: string | null;

  quesKhaBN: string;
  quesKhaEng: string;
  quesKhaLinkType: KnowledgeLinkType | null;
  quesKhaLinkId: number | null;
  ansKhaBN: string | null;
  ansKhaEng: string | null;

  quesGaBN: string;
  quesGaEng: string;
  quesGaLinkType: KnowledgeLinkType | null;
  quesGaLinkId: number | null;
  ansGaBN: string | null;
  ansGaEng: string | null;

  quesGhaBN: string;
  quesGhaEng: string;
  quesGhaLinkType: KnowledgeLinkType | null;
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
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }

  return trimmed;
}

function normalizeLink(
  linkType?: KnowledgeLinkType | null,
  linkId?: number | null,
): NormalizedLink {
  const normalizedType = linkType ?? null;
  const normalizedId = linkId ?? null;

  if (normalizedType === null && normalizedId === null) {
    return {
      type: null,
      id: null,
    };
  }

  if (normalizedType === null) {
    throw new Error("Link type is required when link ID is provided");
  }

  if (normalizedId === null) {
    throw new Error("Link ID is required when link type is provided");
  }

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Link ID must be a positive integer");
  }

  return {
    type: normalizedType,
    id: normalizedId,
  };
}

async function getKnowledgeNodeSubjectId(
  linkType: KnowledgeLinkType,
  linkId: number,
): Promise<number | null> {
  switch (linkType) {
    case "CHAPTER": {
      const chapter = await prisma.orm.public.Chapter.first({
        id: linkId,
      });

      return chapter?.subjectId ?? null;
    }

    case "LESSON": {
      const lesson = await prisma.orm.public.Lesson.first({
        id: linkId,
      });

      if (!lesson) {
        return null;
      }

      const chapter = await prisma.orm.public.Chapter.first({
        id: lesson.chapterId,
      });

      return chapter?.subjectId ?? null;
    }

    case "CONCEPT": {
      const concept = await prisma.orm.public.Concept.first({
        id: linkId,
      });

      if (!concept) {
        return null;
      }

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      if (!lesson) {
        return null;
      }

      const chapter = await prisma.orm.public.Chapter.first({
        id: lesson.chapterId,
      });

      return chapter?.subjectId ?? null;
    }

    case "EXECUTION": {
      const execution = await prisma.orm.public.Execution.first({
        id: linkId,
      });

      if (!execution) {
        return null;
      }

      const concept = await prisma.orm.public.Concept.first({
        id: execution.conceptId,
      });

      if (!concept) {
        return null;
      }

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      if (!lesson) {
        return null;
      }

      const chapter = await prisma.orm.public.Chapter.first({
        id: lesson.chapterId,
      });

      return chapter?.subjectId ?? null;
    }
  }
}

async function validateKnowledgeLink(
  questionPaperSubjectId: number,
  linkType: KnowledgeLinkType | null,
  linkId: number | null,
): Promise<void> {
  if (linkType === null && linkId === null) {
    return;
  }

  if (linkType === null || linkId === null) {
    throw new Error("Knowledge link type and ID must be provided together");
  }

  const subjectId = await getKnowledgeNodeSubjectId(linkType, linkId);

  if (subjectId === null) {
    throw new Error(`${linkType} with ID ${linkId} was not found`);
  }

  if (subjectId !== questionPaperSubjectId) {
    throw new Error(
      `${linkType} with ID ${linkId} does not belong to the Question Paper subject`,
    );
  }
}

async function validateAllLinks(
  questionPaperSubjectId: number,
  links: NormalizedLink[],
): Promise<void> {
  for (const link of links) {
    await validateKnowledgeLink(questionPaperSubjectId, link.type, link.id);
  }
}

function normalizeData(data: CreateCQInput): NormalizedCQData {
  const kaLink = normalizeLink(data.quesKaLinkType, data.quesKaLinkId);

  const khaLink = normalizeLink(data.quesKhaLinkType, data.quesKhaLinkId);

  const gaLink = normalizeLink(data.quesGaLinkType, data.quesGaLinkId);

  const ghaLink = normalizeLink(data.quesGhaLinkType, data.quesGhaLinkId);

  return {
    questionPaperId: data.questionPaperId,
    qusNo: data.qusNo,

    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,

    quesUddipok: normalizeOptionalText(data.quesUddipok),
    imageUrl: normalizeOptionalText(data.imageUrl),

    quesKaBN: normalizeRequiredText(data.quesKaBN, "quesKaBN"),
    quesKaEng: normalizeRequiredText(data.quesKaEng, "quesKaEng"),
    quesKaLinkType: kaLink.type,
    quesKaLinkId: kaLink.id,
    ansKaBN: normalizeOptionalText(data.ansKaBN),
    ansKaEng: normalizeOptionalText(data.ansKaEng),

    quesKhaBN: normalizeRequiredText(data.quesKhaBN, "quesKhaBN"),
    quesKhaEng: normalizeRequiredText(data.quesKhaEng, "quesKhaEng"),
    quesKhaLinkType: khaLink.type,
    quesKhaLinkId: khaLink.id,
    ansKhaBN: normalizeOptionalText(data.ansKhaBN),
    ansKhaEng: normalizeOptionalText(data.ansKhaEng),

    quesGaBN: normalizeRequiredText(data.quesGaBN, "quesGaBN"),
    quesGaEng: normalizeRequiredText(data.quesGaEng, "quesGaEng"),
    quesGaLinkType: gaLink.type,
    quesGaLinkId: gaLink.id,
    ansGaBN: normalizeOptionalText(data.ansGaBN),
    ansGaEng: normalizeOptionalText(data.ansGaEng),

    quesGhaBN: normalizeRequiredText(data.quesGhaBN, "quesGhaBN"),
    quesGhaEng: normalizeRequiredText(data.quesGhaEng, "quesGhaEng"),
    quesGhaLinkType: ghaLink.type,
    quesGhaLinkId: ghaLink.id,
    ansGhaBN: normalizeOptionalText(data.ansGhaBN),
    ansGhaEng: normalizeOptionalText(data.ansGhaEng),
  };
}

async function validateQuestionPaper(
  questionPaperId: number,
): Promise<{ id: number; subjectId: number }> {
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
  qusNo: number,
  currentCQId?: number,
): Promise<void> {
  if (!Number.isInteger(qusNo) || qusNo <= 0) {
    throw new Error("Question number must be a positive integer");
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

export async function createCQ(data: CreateCQInput) {
  const questionPaper = await validateQuestionPaper(data.questionPaperId);

  await validateQuestionNumber(data.questionPaperId, data.qusNo);

  const normalizedData = normalizeData(data);

  await validateAllLinks(questionPaper.subjectId, [
    {
      type: normalizedData.quesKaLinkType,
      id: normalizedData.quesKaLinkId,
    },
    {
      type: normalizedData.quesKhaLinkType,
      id: normalizedData.quesKhaLinkId,
    },
    {
      type: normalizedData.quesGaLinkType,
      id: normalizedData.quesGaLinkId,
    },
    {
      type: normalizedData.quesGhaLinkType,
      id: normalizedData.quesGhaLinkId,
    },
  ]);

  return prisma.orm.public.CQ.create({
    questionPaperId: normalizedData.questionPaperId,
    qusNo: normalizedData.qusNo,

    descriptionBN: normalizedData.descriptionBN,
    descriptionEng: normalizedData.descriptionEng,

    quesUddipok: normalizedData.quesUddipok,
    imageUrl: normalizedData.imageUrl,

    quesKaBN: normalizedData.quesKaBN,
    quesKaEng: normalizedData.quesKaEng,
    quesKaLinkType: normalizedData.quesKaLinkType,
    quesKaLinkId: normalizedData.quesKaLinkId,
    ansKaBN: normalizedData.ansKaBN,
    ansKaEng: normalizedData.ansKaEng,

    quesKhaBN: normalizedData.quesKhaBN,
    quesKhaEng: normalizedData.quesKhaEng,
    quesKhaLinkType: normalizedData.quesKhaLinkType,
    quesKhaLinkId: normalizedData.quesKhaLinkId,
    ansKhaBN: normalizedData.ansKhaBN,
    ansKhaEng: normalizedData.ansKhaEng,

    quesGaBN: normalizedData.quesGaBN,
    quesGaEng: normalizedData.quesGaEng,
    quesGaLinkType: normalizedData.quesGaLinkType,
    quesGaLinkId: normalizedData.quesGaLinkId,
    ansGaBN: normalizedData.ansGaBN,
    ansGaEng: normalizedData.ansGaEng,

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
    return prisma.orm.public.CQ.where({ questionPaperId })
      .orderBy((cq) => cq.qusNo.asc())
      .all();
  }

  return prisma.orm.public.CQ.orderBy((cq) => cq.id.desc()).all();
}

export async function getCQ(id: number) {
  return prisma.orm.public.CQ.first({ id });
}

export async function updateCQ(id: number, data: UpdateCQInput) {
  const existingCQ = await prisma.orm.public.CQ.first({
    id,
  });

  if (!existingCQ) {
    return null;
  }

  const questionPaper = await validateQuestionPaper(data.questionPaperId);

  await validateQuestionNumber(data.questionPaperId, data.qusNo, id);

  const normalizedData = normalizeData(data);

  await validateAllLinks(questionPaper.subjectId, [
    {
      type: normalizedData.quesKaLinkType,
      id: normalizedData.quesKaLinkId,
    },
    {
      type: normalizedData.quesKhaLinkType,
      id: normalizedData.quesKhaLinkId,
    },
    {
      type: normalizedData.quesGaLinkType,
      id: normalizedData.quesGaLinkId,
    },
    {
      type: normalizedData.quesGhaLinkType,
      id: normalizedData.quesGhaLinkId,
    },
  ]);

  return prisma.orm.public.CQ.where({ id }).update({
    questionPaperId: normalizedData.questionPaperId,
    qusNo: normalizedData.qusNo,

    descriptionBN: normalizedData.descriptionBN,
    descriptionEng: normalizedData.descriptionEng,

    quesUddipok: normalizedData.quesUddipok,
    imageUrl: normalizedData.imageUrl,

    quesKaBN: normalizedData.quesKaBN,
    quesKaEng: normalizedData.quesKaEng,
    quesKaLinkType: normalizedData.quesKaLinkType,
    quesKaLinkId: normalizedData.quesKaLinkId,
    ansKaBN: normalizedData.ansKaBN,
    ansKaEng: normalizedData.ansKaEng,

    quesKhaBN: normalizedData.quesKhaBN,
    quesKhaEng: normalizedData.quesKhaEng,
    quesKhaLinkType: normalizedData.quesKhaLinkType,
    quesKhaLinkId: normalizedData.quesKhaLinkId,
    ansKhaBN: normalizedData.ansKhaBN,
    ansKhaEng: normalizedData.ansKhaEng,

    quesGaBN: normalizedData.quesGaBN,
    quesGaEng: normalizedData.quesGaEng,
    quesGaLinkType: normalizedData.quesGaLinkType,
    quesGaLinkId: normalizedData.quesGaLinkId,
    ansGaBN: normalizedData.ansGaBN,
    ansGaEng: normalizedData.ansGaEng,

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

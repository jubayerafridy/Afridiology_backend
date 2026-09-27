import { prisma } from "../../../config/prisma.js";

export type QuestionType = "CQ" | "MCQ";

export type QuestionSourceType =
  | "BOARD"
  | "TEST_PAPER"
  | "MODEL_TEST"
  | "GAME"
  | "QUIZ"
  | "EXTRA";

export interface CreateQuestionPaperInput {
  class: string;
  subjectId: number;
  questionType: QuestionType;
  source: QuestionSourceType;
  board?: string | null;
  institution?: string | null;
  year?: number | null;
}

export interface UpdateQuestionPaperInput {
  class: string;
  subjectId: number;
  questionType: QuestionType;
  source: QuestionSourceType;
  board?: string | null;
  institution?: string | null;
  year?: number | null;
}

/**
 * Validates the conditional metadata rules.
 *
 * BOARD:
 *   board       required
 *   year        required
 *   institution forbidden
 *
 * TEST_PAPER:
 *   institution required
 *   year        required
 *   board       forbidden
 *
 * MODEL_TEST / GAME / QUIZ / EXTRA:
 *   board       forbidden
 *   institution forbidden
 *   year        forbidden
 */
function validateSourceMetadata(
  data: CreateQuestionPaperInput | UpdateQuestionPaperInput,
): void {
  const board = data.board?.trim();
  const institution = data.institution?.trim();
  const year = data.year;

  switch (data.source) {
    case "BOARD": {
      if (!board) {
        throw new Error("Board is required for BOARD source");
      }

      if (institution) {
        throw new Error("Institution is not allowed for BOARD source");
      }

      if (year === undefined || year === null) {
        throw new Error("Year is required for BOARD source");
      }

      break;
    }

    case "TEST_PAPER": {
      if (!institution) {
        throw new Error("Institution is required for TEST_PAPER source");
      }

      if (board) {
        throw new Error("Board is not allowed for TEST_PAPER source");
      }

      if (year === undefined || year === null) {
        throw new Error("Year is required for TEST_PAPER source");
      }

      break;
    }

    case "MODEL_TEST":
    case "GAME":
    case "QUIZ":
    case "EXTRA": {
      if (board) {
        throw new Error("Board is not allowed for this source");
      }

      if (institution) {
        throw new Error("Institution is not allowed for this source");
      }

      if (year !== undefined && year !== null) {
        throw new Error("Year is not allowed for this source");
      }

      break;
    }
  }
}

/**
 * Converts conditional fields into explicit database-safe values.
 *
 * We deliberately use null instead of undefined because the
 * PostgreSQL columns are nullable and exactOptionalPropertyTypes
 * is enabled in this project.
 */
function normalizeData(
  data: CreateQuestionPaperInput | UpdateQuestionPaperInput,
) {
  switch (data.source) {
    case "BOARD":
      return {
        class: data.class.trim(),
        subjectId: data.subjectId,
        questionType: data.questionType,
        source: data.source,
        board: data.board?.trim() ?? null,
        institution: null,
        year: data.year ?? null,
      };

    case "TEST_PAPER":
      return {
        class: data.class.trim(),
        subjectId: data.subjectId,
        questionType: data.questionType,
        source: data.source,
        board: null,
        institution: data.institution?.trim() ?? null,
        year: data.year ?? null,
      };

    case "MODEL_TEST":
    case "GAME":
    case "QUIZ":
    case "EXTRA":
      return {
        class: data.class.trim(),
        subjectId: data.subjectId,
        questionType: data.questionType,
        source: data.source,
        board: null,
        institution: null,
        year: null,
      };
  }
}

export async function createQuestionPaper(data: CreateQuestionPaperInput) {
  const subject = await prisma.orm.public.Subject.first({
    id: data.subjectId,
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  validateSourceMetadata(data);

  const normalizedData = normalizeData(data);

  return prisma.orm.public.QuestionPaper.create({
    class: normalizedData.class,
    subjectId: normalizedData.subjectId,
    questionType: normalizedData.questionType,
    source: normalizedData.source,
    board: normalizedData.board,
    institution: normalizedData.institution,
    year: normalizedData.year,
  });
}

export async function getQuestionPapers(subjectId?: number) {
  if (subjectId !== undefined) {
    return prisma.orm.public.QuestionPaper.where({ subjectId })
      .orderBy((questionPaper) => questionPaper.id.desc())
      .all();
  }

  return prisma.orm.public.QuestionPaper.orderBy((questionPaper) =>
    questionPaper.id.desc(),
  ).all();
}

export async function getQuestionPaper(id: number) {
  return prisma.orm.public.QuestionPaper.first({
    id,
  });
}

export async function updateQuestionPaper(
  id: number,
  data: UpdateQuestionPaperInput,
) {
  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id,
  });

  if (!questionPaper) {
    return null;
  }

  const subject = await prisma.orm.public.Subject.first({
    id: data.subjectId,
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  validateSourceMetadata(data);

  const normalizedData = normalizeData(data);

  return prisma.orm.public.QuestionPaper.where({ id }).update({
    class: normalizedData.class,
    subjectId: normalizedData.subjectId,
    questionType: normalizedData.questionType,
    source: normalizedData.source,
    board: normalizedData.board,
    institution: normalizedData.institution,
    year: normalizedData.year,
  });
}

export async function deleteQuestionPaper(id: number) {
  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id,
  });

  if (!questionPaper) {
    return null;
  }

  return prisma.orm.public.QuestionPaper.where({ id }).delete();
}

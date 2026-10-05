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
 * Converts conditional fields into explicit
 * database-safe values.
 *
 * We deliberately use null instead of undefined
 * because the PostgreSQL columns are nullable and
 * exactOptionalPropertyTypes is enabled.
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

/**
 * Returns Question Papers using the supplied filters.
 *
 * CQ admin board flow can use:
 *
 *   subjectId
 *   source = BOARD
 *   questionType = CQ
 *
 * Optional filters are supported so the same
 * function remains reusable for other Question
 * Paper flows.
 */
export async function getQuestionPapers(filters?: {
  subjectId?: number;
  class?: string;
  source?: QuestionSourceType;
  questionType?: QuestionType;
  board?: string;
  year?: number;
}) {
  let query = prisma.orm.public.QuestionPaper;

  if (filters?.subjectId !== undefined) {
    query = query.where({
      subjectId: filters.subjectId,
    });
  }

  if (filters?.class !== undefined) {
    query = query.where({
      class: filters.class.trim(),
    });
  }

  if (filters?.source !== undefined) {
    query = query.where({
      source: filters.source,
    });
  }

  if (filters?.questionType !== undefined) {
    query = query.where({
      questionType: filters.questionType,
    });
  }

  if (filters?.board !== undefined) {
    query = query.where({
      board: filters.board.trim(),
    });
  }

  if (filters?.year !== undefined) {
    query = query.where({
      year: filters.year,
    });
  }

  return query.orderBy((questionPaper) => questionPaper.id.desc()).all();
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

/**
 * Deletes a Question Paper and all CQs
 * belonging to that Question Paper.
 *
 * CQ rows are removed first because CQ has
 * questionPaperId pointing to QuestionPaper.
 */
export async function deleteQuestionPaper(id: number) {
  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id,
  });

  if (!questionPaper) {
    return null;
  }

  /**
   * Delete every CQ belonging to this
   * Question Paper.
   *
   * This does not affect CQs belonging to
   * any other Question Paper.
   */
  await prisma.orm.public.CQ.where({
    questionPaperId: id,
  }).delete();

  /**
   * Delete the Question Paper itself
   * only after its CQs are removed.
   */
  return prisma.orm.public.QuestionPaper.where({ id }).delete();
}

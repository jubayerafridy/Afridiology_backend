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

  subjectId: string;

  questionType: QuestionType;

  source: QuestionSourceType;

  board?: string | null;

  institution?: string | null;

  year?: number | null;
}

export interface UpdateQuestionPaperInput {
  class: string;

  subjectId: string;

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

/**

 * Creates a QuestionPaper only when a matching

 * QuestionPaper does not already exist.

 *

 * CQ and MCQ share the same QuestionPaper.

 *

 * questionType is retained in the QuestionPaper

 * model for compatibility, but it does NOT decide

 * whether the QuestionPaper can be used by CQ or MCQ.

 *

 * Matching is based on the actual QuestionPaper

 * metadata:

 *

 *   class

 *   subjectId

 *   source

 *   board

 *   institution

 *   year

 *

 * Therefore:

 *

 *   CQ creates Dhaka 2026 paper

 *       ↓

 *   MCQ requests Dhaka 2026 paper

 *       ↓

 *   same QuestionPaper ID is returned

 */

export async function createQuestionPaper(data: CreateQuestionPaperInput) {
  const subject = await prisma.orm.public.Subject.first({
    id: data.subjectId,
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  validateSourceMetadata(data);

  const normalizedData = normalizeData(data);

  /**

   * First look for an existing QuestionPaper

   * with the same metadata.

   *

   * IMPORTANT:

   * questionType is intentionally NOT part of

   * this lookup.

   *

   * This is what allows CQ and MCQ to share

   * one QuestionPaper.

   */

  let query = prisma.orm.public.QuestionPaper;

  query = query.where({
    class: normalizedData.class,
  });

  query = query.where({
    subjectId: normalizedData.subjectId,
  });

  query = query.where({
    source: normalizedData.source,
  });

  query = query.where({
    board: normalizedData.board,
  });

  query = query.where({
    institution: normalizedData.institution,
  });

  query = query.where({
    year: normalizedData.year,
  });

  const existingQuestionPaper = await query

    .orderBy((questionPaper) => questionPaper.id.asc())

    .first();

  /**

   * If the QuestionPaper already exists,

   * return it instead of creating another one.

   *

   * Its existing questionType is preserved.

   */

  if (existingQuestionPaper) {
    return existingQuestionPaper;
  }

  /**

   * No matching QuestionPaper exists,

   * so create the first one.

   *

   * questionType is stored only as the type

   * supplied when the paper was originally created.

   */

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

 * questionType is intentionally NOT used as a database

 * restriction.

 *

 * A QuestionPaper created from CQ must also be available

 * to MCQ, and a QuestionPaper created from MCQ must also

 * be available to CQ.

 *

 * Therefore both CQ and MCQ can request:

 *

 *   subjectId

 *   class

 *   source

 *   board

 *   year

 *

 * and receive the same QuestionPaper records.

 */

export async function getQuestionPapers(filters?: {
  subjectId?: string;

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

  /**

   * questionType is deliberately ignored here.

   *

   * It remains in the function's input type so existing

   * controller/frontend calls do not immediately break,

   * but it must not prevent the other question type from

   * seeing the same QuestionPaper.

   */

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

export async function getQuestionPaper(id: string) {
  return prisma.orm.public.QuestionPaper.first({
    id,
  });
}

export async function updateQuestionPaper(
  id: string,

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

  /**

   * questionType is retained and updated because it still

   * exists in the database model.

   *

   * It does NOT control whether this QuestionPaper can

   * contain or be used by CQ/MCQ.

   */

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

 * Deletes a QuestionPaper and ALL questions belonging

 * to that QuestionPaper.

 *

 * One QuestionPaper can contain both:

 *

 *   CQ

 *   MCQ

 *

 * Therefore both tables must be cleared before the

 * QuestionPaper itself is deleted.

 */

export async function deleteQuestionPaper(id: string) {
  const questionPaper = await prisma.orm.public.QuestionPaper.first({
    id,
  });

  if (!questionPaper) {
    return null;
  }

  /**

   * Delete all CQs belonging to this QuestionPaper.

   */

  await prisma.orm.public.CQ.where({
    questionPaperId: id,
  }).delete();

  /**

   * Delete all MCQs belonging to this QuestionPaper.

   */

  await prisma.orm.public.MCQ.where({
    questionPaperId: id,
  }).delete();

  /**

   * Delete the QuestionPaper only after both

   * dependent question types have been removed.

   */

  return prisma.orm.public.QuestionPaper.where({ id }).delete();
}

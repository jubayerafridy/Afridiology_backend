import type {
  QuestionProgressStatus,
  QuestionProgressTargetType,
} from "./questionProgress.constants.js";

/*
 * ==================================================
 * QUESTION PROGRESS TYPES
 * ==================================================
 *
 * Application-level types for the question progress
 * system.
 *
 * These are deliberately independent from Prisma
 * generated types so the API/service layer does not
 * become tightly coupled to database representation.
 */

/* ==================================================
 * QUESTION PROGRESS TARGET
 * ================================================== */

export interface QuestionProgressTarget {
  targetType: QuestionProgressTargetType;

  targetId: string;
}

/* ==================================================
 * QUESTION PROGRESS STATE
 * ==================================================
 *
 * Compact progress information that can travel with
 * Knowledge Graph / Question Bank data.
 */

export interface QuestionProgressState {
  status: QuestionProgressStatus;
}

/* ==================================================
 * SET QUESTION PROGRESS
 * ==================================================
 *
 * Used when a student manually changes the progress
 * status of a Concept, Execution, CQ, or MCQ.
 */

export interface SetQuestionProgressInput {
  targetType: QuestionProgressTargetType;

  targetId: string;

  status: QuestionProgressStatus;
}

/* ==================================================
 * QUESTION PROGRESS STATE LOOKUP
 * ==================================================
 *
 * Used internally by Knowledge Graph and Question
 * Bank to load progress for multiple targets.
 */

export interface QuestionProgressStateLookupTarget {
  targetType: QuestionProgressTargetType;

  targetId: string;
}

export type QuestionProgressStateMap = Map<string, QuestionProgressState>;

/* ==================================================
 * HELPER KEY
 * ================================================== */

export function getQuestionProgressTargetKey(
  targetType: QuestionProgressTargetType,
  targetId: string,
): string {
  return `${targetType}:${targetId}`;
}

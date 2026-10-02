/*
 * ==================================================
 * QUESTION PROGRESS CONSTANTS
 * ==================================================
 *
 * Shared application-level constants for the
 * question progress system.
 *
 * Progress can be attached to:
 *
 * - Concept
 * - Execution
 * - CQ
 * - MCQ
 *
 * These values intentionally match the values stored
 * in the QuestionProgress database contract.
 */

/* ==================================================
 * TARGET TYPE
 * ================================================== */

export const QUESTION_PROGRESS_TARGET_TYPES = [
  "CONCEPT",
  "EXECUTION",
  "CQ",
  "MCQ",
] as const;

export type QuestionProgressTargetType =
  (typeof QUESTION_PROGRESS_TARGET_TYPES)[number];

/* ==================================================
 * STATUS
 * ================================================== */

export const QUESTION_PROGRESS_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type QuestionProgressStatus =
  (typeof QUESTION_PROGRESS_STATUSES)[number];

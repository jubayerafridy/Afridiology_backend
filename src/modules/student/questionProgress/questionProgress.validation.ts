import {
  QUESTION_PROGRESS_STATUSES,
  QUESTION_PROGRESS_TARGET_TYPES,
  type QuestionProgressStatus,
  type QuestionProgressTargetType,
} from "./questionProgress.constants.js";

import type { SetQuestionProgressInput } from "./questionProgress.types.js";

/*
 * ==================================================
 * QUESTION PROGRESS VALIDATION
 * ==================================================
 *
 * Validation for the QuestionProgress API/service
 * boundary.
 *
 * The service should never receive an unchecked
 * targetType, targetId, or status.
 */

/* ==================================================
 * BASIC HELPERS
 * ================================================== */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/* ==================================================
 * TARGET TYPE
 * ================================================== */

export function isQuestionProgressTargetType(
  value: unknown,
): value is QuestionProgressTargetType {
  return (
    typeof value === "string" &&
    (QUESTION_PROGRESS_TARGET_TYPES as readonly string[]).includes(value)
  );
}

/* ==================================================
 * STATUS
 * ================================================== */

export function isQuestionProgressStatus(
  value: unknown,
): value is QuestionProgressStatus {
  return (
    typeof value === "string" &&
    (QUESTION_PROGRESS_STATUSES as readonly string[]).includes(value)
  );
}

/* ==================================================
 * TARGET ID
 * ================================================== */

export function validateQuestionProgressTargetId(
  targetId: unknown,
): asserts targetId is string {
  if (typeof targetId !== "string" || targetId.trim().length === 0) {
    throw new Error("targetId must be a valid UUID");
  }
}

/* ==================================================
 * SET QUESTION PROGRESS INPUT
 * ================================================== */

export function validateSetQuestionProgressInput(
  input: unknown,
): asserts input is SetQuestionProgressInput {
  if (!isRecord(input)) {
    throw new Error("Invalid question progress input");
  }

  if (!isQuestionProgressTargetType(input.targetType)) {
    throw new Error("Invalid question progress targetType");
  }

  validateQuestionProgressTargetId(input.targetId);

  if (!isQuestionProgressStatus(input.status)) {
    throw new Error("Invalid question progress status");
  }
}

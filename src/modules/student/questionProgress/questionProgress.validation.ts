import {
  QUESTION_PROGRESS_STATUSES,
  QUESTION_PROGRESS_TARGET_TYPES,
  type QuestionProgressStatus,
  type QuestionProgressTargetType,
} from "./questionProgress.constants.js";

import type { SetQuestionProgressInput } from "./questionProgress.types.js";
import { AppError } from "../../../core/errors/AppError.js";
import { isUuid } from "../student.validation.js";

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

function badRequest(message: string): never {
  throw new AppError(message, 400, "BAD_REQUEST");
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
  if (!isUuid(targetId)) {
    badRequest("targetId must be a valid UUID");
  }
}

/* ==================================================
 * SET QUESTION PROGRESS INPUT
 * ================================================== */

export function validateSetQuestionProgressInput(
  input: unknown,
): asserts input is SetQuestionProgressInput {
  if (!isRecord(input)) {
    badRequest("Invalid question progress input");
  }

  if (Object.keys(input).some((key) => !["targetType", "targetId", "status"].includes(key))) {
    badRequest("Unexpected request field");
  }

  if (!isQuestionProgressTargetType(input.targetType)) {
    badRequest("Invalid question progress targetType");
  }

  validateQuestionProgressTargetId(input.targetId);

  if (!isQuestionProgressStatus(input.status)) {
    badRequest("Invalid question progress status");
  }
}

import type { Request, Response } from "express";
import { AppError } from "../../../core/errors/AppError.js";
import { isUuid } from "../student.validation.js";

import {
  getQuestionProgress,
  setQuestionProgress,
} from "./questionProgress.service.js";

import type { QuestionProgressTargetType } from "./questionProgress.constants.js";

import type { SetQuestionProgressInput } from "./questionProgress.types.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

/**
 * Authentication middleware attaches `auth` to the request
 * at runtime.
 *
 * The authenticate middleware stores:
 *
 * req.auth = {
 *   userId,
 *   role,
 *   sessionId,
 * }
 */
function getAuthenticatedUserId(req: Request): string {
  const authenticatedRequest = req as AuthenticatedRequest;

  if (!authenticatedRequest.auth) {
    throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
  }

  return authenticatedRequest.auth.userId;
}

/**
 * Express 5 params can be typed as:
 *
 * string | string[] | undefined
 *
 * Normalize that into a single string.
 */
function getRequiredParam(
  value: string | string[] | undefined,
  name: string,
): string {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (typeof normalizedValue !== "string" || normalizedValue.trim().length === 0) {
    throw new AppError(`${name} is required`, 400, "BAD_REQUEST");
  }
  return normalizedValue;
}

/**
 * Convert a route parameter into a UUID string.
 */
function getUuidParam(
  value: string | string[] | undefined,
  name: string,
): string {
  const normalizedValue = getRequiredParam(value, name).trim();

  if (!isUuid(normalizedValue)) {
    throw new AppError(`${name} must be a valid UUID`, 400, "BAD_REQUEST");
  }

  return normalizedValue;
}

/**
 * Validate and normalize the target type coming from
 * the URL.
 *
 * The service performs the authoritative validation too,
 * but normalizing it here keeps the controller contract
 * explicit.
 */
function getTargetTypeParam(
  value: string | string[] | undefined,
): QuestionProgressTargetType {
  const normalizedValue = getRequiredParam(value, "targetType").toUpperCase();

  if (
    normalizedValue !== "CONCEPT" &&
    normalizedValue !== "EXECUTION" &&
    normalizedValue !== "CQ" &&
    normalizedValue !== "MCQ"
  ) {
    throw new AppError("Invalid question progress targetType", 400, "BAD_REQUEST");
  }

  return normalizedValue;
}

/*
 * ==================================================
 * GET QUESTION PROGRESS
 * ==================================================
 */

/**
 * GET /question-progress/:targetType/:targetId
 *
 * Returns the current progress state for one target.
 *
 * If the student has never stored progress for the
 * target, the service returns:
 *
 * {
 *   status: "NOT_STARTED"
 * }
 */
export async function getQuestionProgressController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const targetType = getTargetTypeParam(req.params.targetType);

  const targetId = getUuidParam(req.params.targetId, "targetId");

  const progress = await getQuestionProgress(userId, targetType, targetId);

  res.status(200).json(progress);
}

/*
 * ==================================================
 * SET QUESTION PROGRESS
 * ==================================================
 */

/**
 * PUT /question-progress
 *
 * Creates the progress row when it does not exist,
 * or updates the existing row.
 *
 * Expected body:
 *
 * {
 *   targetType: "CQ",
 *   targetId: 123,
 *   status: "IN_PROGRESS"
 * }
 */
export async function setQuestionProgressController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const input = req.body as SetQuestionProgressInput;

  const progress = await setQuestionProgress(userId, input);

  res.status(200).json(progress);
}

import { prisma } from "../../../config/prisma.js";

import type {
  QuestionProgressStateLookupTarget,
  SetQuestionProgressInput,
  QuestionProgressState,
} from "./questionProgress.types.js";

import { getQuestionProgressTargetKey } from "./questionProgress.types.js";

import { validateSetQuestionProgressInput } from "./questionProgress.validation.js";

/*
 * ==================================================
 * QUESTION PROGRESS SERVICE
 * ==================================================
 *
 * Responsible for persistent student progress for:
 *
 * - Concept
 * - Execution
 * - CQ
 * - MCQ
 *
 * There is ONLY ONE QuestionProgress row for:
 *
 *   user + targetType + targetId
 *
 * The database unique constraint enforces this.
 *
 * Progress states:
 *
 *   NOT_STARTED
 *   IN_PROGRESS
 *   COMPLETED
 */

/* ==================================================
 * ERROR HELPER
 * ================================================== */

function createError(name: string, message: string): Error {
  const error = new Error(message);

  error.name = name;

  return error;
}

/* ==================================================
 * TARGET EXISTENCE
 * ==================================================
 *
 * QuestionProgress uses a polymorphic:
 *
 *   targetType + targetId
 *
 * pair.
 *
 * Therefore the database cannot have a normal foreign
 * key to Concept / Execution / CQ / MCQ.
 *
 * We validate the actual target here before creating
 * or updating progress.
 */

/* ==================================================
 * CONCEPT
 * ================================================== */

async function ensureConceptExists(targetId: string): Promise<void> {
  const concept = await prisma.orm.public.Concept.first({
    id: targetId,
  });

  if (!concept || !concept.isActive) {
    throw createError("NOT_FOUND", "Concept not found");
  }
}

/* ==================================================
 * EXECUTION
 * ================================================== */

async function ensureExecutionExists(targetId: string): Promise<void> {
  const execution = await prisma.orm.public.Execution.first({
    id: targetId,
  });

  if (!execution || !execution.isActive) {
    throw createError("NOT_FOUND", "Execution not found");
  }
}

/* ==================================================
 * CQ
 * ================================================== */

async function ensureCQExists(targetId: string): Promise<void> {
  const cq = await prisma.orm.public.CQ.first({
    id: targetId,
  });

  if (!cq || !cq.isActive) {
    throw createError("NOT_FOUND", "CQ not found");
  }
}

/* ==================================================
 * MCQ
 * ================================================== */

async function ensureMCQExists(targetId: string): Promise<void> {
  const mcq = await prisma.orm.public.MCQ.first({
    id: targetId,
  });

  if (!mcq || !mcq.isActive) {
    throw createError("NOT_FOUND", "MCQ not found");
  }
}

/* ==================================================
 * GENERIC TARGET VALIDATION
 * ================================================== */

async function ensureTargetExists(
  targetType: SetQuestionProgressInput["targetType"],
  targetId: string,
): Promise<void> {
  switch (targetType) {
    case "CONCEPT":
      await ensureConceptExists(targetId);
      return;

    case "EXECUTION":
      await ensureExecutionExists(targetId);
      return;

    case "CQ":
      await ensureCQExists(targetId);
      return;

    case "MCQ":
      await ensureMCQExists(targetId);
      return;
  }
}

/* ==================================================
 * GET QUESTION PROGRESS
 * ==================================================
 *
 * Returns the student's saved progress for one target.
 *
 * If no row exists, the target is treated as:
 *
 *   NOT_STARTED
 *
 * We do NOT create a database row simply because
 * somebody requested the current state.
 */

export async function getQuestionProgress(
  userId: string,
  targetType: SetQuestionProgressInput["targetType"],
  targetId: string,
): Promise<QuestionProgressState> {
  const progress = await prisma.orm.public.QuestionProgress.first({
    userId,
    targetType,
    targetId,
  });

  if (!progress) {
    return {
      status: "NOT_STARTED",
    };
  }

  return {
    status: progress.status as QuestionProgressState["status"],
  };
}

/* ==================================================
 * SET / UPSERT QUESTION PROGRESS
 * ==================================================
 *
 * Idempotent by:
 *
 *   user + targetType + targetId
 *
 * If the progress row already exists, its status is
 * updated.
 *
 * Otherwise a new row is created.
 */

export async function setQuestionProgress(
  userId: string,
  input: SetQuestionProgressInput,
): Promise<QuestionProgressState> {
  /*
   * This is an assertion function.
   *
   * It validates the input and narrows `input`
   * in-place. It does NOT return a validated object.
   */
  validateSetQuestionProgressInput(input);

  await ensureTargetExists(input.targetType, input.targetId);

  const existing = await prisma.orm.public.QuestionProgress.first({
    userId,
    targetType: input.targetType,
    targetId: input.targetId,
  });

  /* --------------------------------------------------
   * UPDATE EXISTING PROGRESS
   * --------------------------------------------------
   */

  if (existing) {
    const updated = await prisma.orm.public.QuestionProgress.where({
      id: existing.id,
    }).update({
      status: input.status,
    });

    if (!updated) {
      throw createError("NOT_FOUND", "Question progress could not be updated");
    }

    return {
      status: updated.status as QuestionProgressState["status"],
    };
  }

  /* --------------------------------------------------
   * CREATE NEW PROGRESS
   * --------------------------------------------------
   */

  const created = await prisma.orm.public.QuestionProgress.create({
    userId,
    targetType: input.targetType,
    targetId: input.targetId,
    status: input.status,
  });

  return {
    status: created.status as QuestionProgressState["status"],
  };
}

/* ==================================================
 * GET QUESTION PROGRESS STATES FOR TARGETS
 * ==================================================
 *
 * Shared internal service used later by:
 *
 * - Knowledge Graph
 * - Question Bank
 * - other student content endpoints
 *
 * The caller supplies only the targets already
 * present in its response.
 *
 * IMPORTANT:
 *
 * We do NOT load every QuestionProgress row for
 * the user.
 *
 * Only requested targets are queried.
 *
 * Missing rows are intentionally omitted from the
 * returned Map.
 *
 * Consumers interpret an absent state as:
 *
 *   NOT_STARTED
 */

export async function getQuestionProgressStates(
  userId: string,
  targets: QuestionProgressStateLookupTarget[],
): Promise<Map<string, QuestionProgressState>> {
  /* --------------------------------------------------
   * STEP 1
   * Deduplicate valid targets.
   * --------------------------------------------------
   */

  const uniqueTargets = new Map<string, QuestionProgressStateLookupTarget>();

  for (const target of targets) {
    if (
      typeof target.targetId !== "string" ||
      target.targetId.trim().length === 0
    ) {
      continue;
    }

    const key = getQuestionProgressTargetKey(
      target.targetType,
      target.targetId,
    );

    uniqueTargets.set(key, target);
  }

  if (uniqueTargets.size === 0) {
    return new Map();
  }

  /* --------------------------------------------------
   * STEP 2
   * Query ONLY the requested targets.
   *
   * This follows the same target-scoped approach
   * already used by the Bookmark service.
   * --------------------------------------------------
   */

  const targetList = Array.from(uniqueTargets.values());

  const progressResults = await Promise.all(
    targetList.map((target) =>
      prisma.orm.public.QuestionProgress.first({
        userId,
        targetType: target.targetType,
        targetId: target.targetId,
      }),
    ),
  );

  /* --------------------------------------------------
   * STEP 3
   * Build the target-keyed state map.
   * --------------------------------------------------
   */

  const result = new Map<string, QuestionProgressState>();

  for (const progress of progressResults) {
    if (!progress) {
      continue;
    }

    const targetType =
      progress.targetType as QuestionProgressStateLookupTarget["targetType"];

    const key = getQuestionProgressTargetKey(targetType, progress.targetId);

    result.set(key, {
      status: progress.status as QuestionProgressState["status"],
    });
  }

  return result;
}

import { prisma } from "../../../config/prisma.js";

import {
  appendExecutionToConceptStructure,
  removeExecutionFromConceptStructure,
} from "../concept/concept.service.js";

/**
 * ================================================================
 * EXECUTION DOCUMENT
 * ================================================================
 *
 * An Execution owns two ordered bilingual documents:
 *
 *   descriptionBN
 *   descriptionEng
 *
 * Each document is simply an ordered JSON array.
 *
 * Example:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "Some explanation"
 *   },
 *   {
 *     "type": "heading",
 *     "content": "Example"
 *   },
 *   {
 *     "type": "table",
 *     "tableID": 12
 *   }
 * ]
 *
 * There is NO block ID.
 *
 * Array order itself is the source of truth.
 *
 * Execution is the lowest hierarchy entity:
 *
 * Chapter
 *   ↓
 * Lesson
 *   ↓
 * Concept
 *   ↓
 * Execution
 *
 * Execution therefore does not have another hierarchy child.
 *
 * ================================================================
 */

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * One item inside descriptionBN / descriptionEng.
 *
 * Only `type` is required.
 *
 * All other properties depend on the block type.
 *
 * Examples:
 *
 * {
 *   type: "text",
 *   content: "..."
 * }
 *
 * {
 *   type: "heading",
 *   content: "..."
 * }
 *
 * {
 *   type: "table",
 *   tableID: 12
 * }
 */
export interface ExecutionDocumentItem {
  type: string;
  [key: string]: JsonValue;
}

export type ExecutionDocument = ExecutionDocumentItem[];

/**
 * Compatibility alias.
 *
 * Older parts of the backend may still import
 * `ExecutionStructure`.
 *
 * It now means the ordered Execution document.
 *
 * It does NOT represent a database `structure` field.
 */
export type ExecutionStructure = ExecutionDocument;

/**
 * ================================================================
 * INPUT TYPES
 * ================================================================
 */

export interface CreateExecutionInput {
  conceptId: number;
  nameBN: string;
  nameEng: string;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

export interface UpdateExecutionInput {
  nameBN: string;
  nameEng: string;

  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

/**
 * ================================================================
 * DOCUMENT NORMALIZER
 * ================================================================
 *
 * Validates the ordered document without imposing any artificial
 * block identity.
 *
 * Rules:
 *
 * - must be an array
 * - every item must be an object
 * - every item must contain a non-empty string `type`
 * - all remaining properties are preserved
 *
 * The function does NOT:
 *
 * - generate IDs
 * - reorder blocks
 * - remove hierarchy references
 * - create structure wrappers
 */

function normalizeExecutionDocument(value: unknown): ExecutionDocument {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ExecutionDocument = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }

    const candidate = item as {
      type?: unknown;
      [key: string]: unknown;
    };

    if (
      typeof candidate.type !== "string" ||
      candidate.type.trim().length === 0
    ) {
      continue;
    }

    normalized.push(candidate as ExecutionDocumentItem);
  }

  return normalized;
}

/**
 * ================================================================
 * CREATE EXECUTION
 * ================================================================
 *
 * Flow:
 *
 * 1. Verify parent Concept.
 * 2. Normalize descriptionBN.
 * 3. Normalize descriptionEng.
 * 4. Create Execution.
 * 5. Add Execution reference to parent Concept document.
 *
 * Parent Concept document receives:
 *
 * {
 *   "type": "execution",
 *   "executionID": newExecutionId
 * }
 *
 * The reference is inserted into BOTH:
 *
 *   Concept.descriptionBN
 *   Concept.descriptionEng
 *
 * No separate `structure` field exists.
 *
 * If parent synchronization fails after the Execution has been
 * created, the new Execution is deleted so that an orphaned
 * hierarchy entity is not left behind.
 */

export async function createExecution(data: CreateExecutionInput) {
  /**
   * --------------------------------------------------
   * Verify parent Concept
   * --------------------------------------------------
   */

  const concept = await prisma.orm.public.Concept.first({
    id: data.conceptId,
  });

  if (!concept) {
    throw new Error("Concept not found");
  }

  /**
   * --------------------------------------------------
   * Normalize bilingual documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeExecutionDocument(data.descriptionBN);

  const descriptionEng = normalizeExecutionDocument(data.descriptionEng);

  /**
   * --------------------------------------------------
   * Create Execution
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * There is no `structure` property here.
   */

  const execution = await prisma.orm.public.Execution.create({
    conceptId: data.conceptId,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN,
    descriptionEng,
  });

  /**
   * --------------------------------------------------
   * Synchronize parent Concept document
   * --------------------------------------------------
   */

  try {
    await appendExecutionToConceptStructure(data.conceptId, execution.id);
  } catch (error) {
    /**
     * ------------------------------------------------
     * Roll back Execution creation
     * ------------------------------------------------
     *
     * The parent Concept could not be updated.
     *
     * Delete the newly-created Execution so that it does
     * not remain as an unreferenced hierarchy entity.
     */

    try {
      await prisma.orm.public.Execution.where({
        id: execution.id,
      }).delete();
    } catch {
      /**
       * Preserve the original parent synchronization error.
       */
    }

    throw error;
  }

  return execution;
}

/**
 * ================================================================
 * GET EXECUTIONS
 * ================================================================
 *
 * Optional Concept filter:
 *
 *   getExecutions(conceptId)
 *
 * Without a Concept filter:
 *
 *   getExecutions()
 *
 * Database ID ordering is used only for ordinary CRUD/listing.
 *
 * The Knowledge Graph does NOT use this ordering for document
 * placement.
 *
 * Execution placement inside the Concept document is determined by:
 *
 *   Concept.descriptionBN
 *   Concept.descriptionEng
 */

export async function getExecutions(conceptId?: number) {
  if (conceptId !== undefined) {
    return prisma.orm.public.Execution.where({
      conceptId,
    })
      .orderBy((execution) => execution.id.asc())
      .all();
  }

  return prisma.orm.public.Execution.orderBy((execution) =>
    execution.id.asc(),
  ).all();
}

/**
 * ================================================================
 * GET SINGLE EXECUTION
 * ================================================================
 */

export async function getExecution(id: number) {
  return prisma.orm.public.Execution.first({
    id,
  });
}

/**
 * ================================================================
 * UPDATE EXECUTION
 * ================================================================
 *
 * Updating an Execution changes only the Execution entity.
 *
 * The parent Concept reference remains:
 *
 * {
 *   type: "execution",
 *   executionID: execution.id
 * }
 *
 * Therefore updating the Execution's content does not alter the
 * parent's document ordering.
 */

export async function updateExecution(id: number, data: UpdateExecutionInput) {
  /**
   * --------------------------------------------------
   * Find Execution
   * --------------------------------------------------
   */

  const execution = await prisma.orm.public.Execution.first({
    id,
  });

  if (!execution) {
    return null;
  }

  /**
   * --------------------------------------------------
   * Normalize bilingual documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeExecutionDocument(data.descriptionBN);

  const descriptionEng = normalizeExecutionDocument(data.descriptionEng);

  /**
   * --------------------------------------------------
   * Update Execution
   * --------------------------------------------------
   */

  return prisma.orm.public.Execution.where({
    id,
  }).update({
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * SET COMPLETE EXECUTION DOCUMENT
 * ================================================================
 *
 * Compatibility helper for callers that want to replace the
 * complete Execution document.
 *
 * New architecture:
 *
 *   descriptionBN
 *   descriptionEng
 *
 * The old single `structure` database field no longer exists.
 *
 * If English is omitted, the existing English document is preserved.
 */

export async function setExecutionStructure(
  executionId: number,
  descriptionBN: ExecutionDocument,
  descriptionEng?: ExecutionDocument,
) {
  const execution = await prisma.orm.public.Execution.first({
    id: executionId,
  });

  if (!execution) {
    return null;
  }

  const normalizedBN = normalizeExecutionDocument(descriptionBN);

  const updateData: {
    descriptionBN: ExecutionDocument;
    descriptionEng?: ExecutionDocument;
  } = {
    descriptionBN: normalizedBN,
  };

  if (descriptionEng !== undefined) {
    updateData.descriptionEng = normalizeExecutionDocument(descriptionEng);
  }

  return prisma.orm.public.Execution.where({
    id: executionId,
  }).update(updateData);
}

/**
 * ================================================================
 * DELETE EXECUTION
 * ================================================================
 *
 * Flow:
 *
 * 1. Find Execution.
 * 2. Read its parent Concept ID.
 * 3. Remove Execution reference from both parent documents.
 * 4. Delete Execution entity.
 *
 * Parent Concept documents:
 *
 *   descriptionBN
 *   descriptionEng
 *
 * are both updated.
 *
 * The reference removed is:
 *
 * {
 *   type: "execution",
 *   executionID: execution.id
 * }
 *
 * All remaining document items preserve their existing order.
 *
 * Connected CQ / MCQ records are intentionally NOT touched.
 *
 * Questions are connected records rather than hierarchy children.
 */

export async function deleteExecution(id: number) {
  /**
   * --------------------------------------------------
   * Find Execution
   * --------------------------------------------------
   */

  const execution = await prisma.orm.public.Execution.first({
    id,
  });

  if (!execution) {
    return null;
  }

  /**
   * --------------------------------------------------
   * Remove Execution reference from parent Concept
   * --------------------------------------------------
   */

  await removeExecutionFromConceptStructure(execution.conceptId, execution.id);

  /**
   * --------------------------------------------------
   * Delete Execution
   * --------------------------------------------------
   *
   * CQ / MCQ records are intentionally untouched.
   */

  return prisma.orm.public.Execution.where({
    id: execution.id,
  }).delete();
}

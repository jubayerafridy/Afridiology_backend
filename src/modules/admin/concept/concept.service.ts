import { prisma } from "../../../config/prisma.js";

import {
  appendConceptToLessonStructure,
  removeConceptFromLessonStructure,
} from "../lesson/lesson.service.js";

/**
 * ================================================================
 * JSON TYPES
 * ================================================================
 */

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      readonly [key: string]: JsonValue;
    };

/**
 * ================================================================
 * CONCEPT DOCUMENT
 * ================================================================
 *
 * Concept.descriptionBN and Concept.descriptionEng are complete
 * ordered JSON documents.
 *
 * Example:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "Some content"
 *   },
 *   {
 *     "type": "execution",
 *     "executionID": 51
 *   },
 *   {
 *     "type": "heading",
 *     "content": "Another section"
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - There is NO `structure`.
 * - There is NO `flow`.
 * - Content items have NO artificial IDs.
 * - Array order is the source of truth.
 *
 * The relational Concept -> Execution relationship is determined
 * by Execution.conceptId.
 *
 * The execution reference inside descriptionBN / descriptionEng
 * determines where that Execution appears in the document.
 */

/**
 * A single item inside descriptionBN / descriptionEng.
 *
 * Only `type` is required.
 *
 * Examples:
 *
 * {
 *   type: "text",
 *   content: "Hello"
 * }
 *
 * {
 *   type: "execution",
 *   executionID: 51
 * }
 */
export interface ConceptDocumentItem {
  type: string;
  [key: string]: JsonValue;
}

export type ConceptDocument = ConceptDocumentItem[];

/**
 * Kept as a compatibility alias for code that may still import
 * ConceptStructure from this service.
 *
 * It now represents the ordered description document.
 *
 * IMPORTANT:
 *
 * This is NOT a database `structure` field.
 */
export type ConceptStructure = ConceptDocument;

/**
 * ================================================================
 * INPUT TYPES
 * ================================================================
 */

export interface CreateConceptInput {
  lessonId: number;
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

export interface UpdateConceptInput {
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

/**
 * ================================================================
 * DOCUMENT NORMALIZATION
 * ================================================================
 *
 * The backend accepts ordered JSON arrays.
 *
 * Every valid item must:
 *
 * - be an object
 * - not be an array
 * - contain a non-empty string `type`
 *
 * No `id` is required.
 *
 * All other JSON properties are preserved.
 */

function normalizeConceptDocument(value: unknown): ConceptDocument {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConceptDocument = [];

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

    normalized.push(candidate as ConceptDocumentItem);
  }

  return normalized;
}

/**
 * ================================================================
 * EXECUTION REFERENCE HELPER
 * ================================================================
 *
 * Reads:
 *
 * {
 *   type: "execution",
 *   executionID: 51
 * }
 */

function getExecutionId(item: ConceptDocumentItem): number | null {
  if (item.type !== "execution") {
    return null;
  }

  const executionId = item.executionID;

  if (
    typeof executionId !== "number" ||
    !Number.isInteger(executionId) ||
    executionId <= 0
  ) {
    return null;
  }

  return executionId;
}

/**
 * ================================================================
 * APPEND EXECUTION TO CONCEPT DOCUMENT
 * ================================================================
 *
 * Called after an Execution has successfully been created.
 *
 * The relational ownership is:
 *
 * Execution.conceptId = conceptId
 *
 * The document reference determines its position:
 *
 * {
 *   type: "execution",
 *   executionID: 51
 * }
 *
 * The same reference is added to:
 *
 * - descriptionBN
 * - descriptionEng
 */

export async function appendExecutionToConceptStructure(
  conceptId: number,
  executionId: number,
) {
  /*
   * --------------------------------------------------
   * Find parent Concept
   * --------------------------------------------------
   */

  const concept = await prisma.orm.public.Concept.first({
    id: conceptId,
  });

  if (!concept) {
    throw new Error("Concept not found");
  }

  /*
   * --------------------------------------------------
   * Verify Execution exists
   * --------------------------------------------------
   *
   * The execution must already exist before it can
   * be referenced by the Concept document.
   */

  const execution = await prisma.orm.public.Execution.first({
    id: executionId,
  });

  if (!execution) {
    throw new Error("Execution not found");
  }

  /*
   * --------------------------------------------------
   * Verify relational ownership
   * --------------------------------------------------
   *
   * The Execution must actually belong to
   * this Concept.
   */

  if (execution.conceptId !== conceptId) {
    throw new Error("Execution does not belong to this Concept");
  }

  /*
   * --------------------------------------------------
   * Normalize both language documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeConceptDocument(concept.descriptionBN);

  const descriptionEng = normalizeConceptDocument(concept.descriptionEng);

  /*
   * --------------------------------------------------
   * Prevent duplicate references
   * --------------------------------------------------
   */

  const bnAlreadyExists = descriptionBN.some(
    (item) => getExecutionId(item) === executionId,
  );

  const engAlreadyExists = descriptionEng.some(
    (item) => getExecutionId(item) === executionId,
  );

  /*
   * If both already contain the reference,
   * there is nothing to do.
   */

  if (bnAlreadyExists && engAlreadyExists) {
    return concept;
  }

  /*
   * --------------------------------------------------
   * Append the Execution reference
   * --------------------------------------------------
   *
   * Array order is the document order.
   */

  if (!bnAlreadyExists) {
    descriptionBN.push({
      type: "execution",
      executionID: executionId,
    });
  }

  if (!engAlreadyExists) {
    descriptionEng.push({
      type: "execution",
      executionID: executionId,
    });
  }

  /*
   * --------------------------------------------------
   * Persist both language documents
   * --------------------------------------------------
   */

  return prisma.orm.public.Concept.where({
    id: conceptId,
  }).update({
    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * REMOVE EXECUTION FROM CONCEPT DOCUMENT
 * ================================================================
 *
 * Removes only the matching Execution reference from:
 *
 * - descriptionBN
 * - descriptionEng
 *
 * Other content and references remain untouched.
 */

export async function removeExecutionFromConceptStructure(
  conceptId: number,
  executionId: number,
) {
  /*
   * --------------------------------------------------
   * Find parent Concept
   * --------------------------------------------------
   */

  const concept = await prisma.orm.public.Concept.first({
    id: conceptId,
  });

  if (!concept) {
    return null;
  }

  /*
   * --------------------------------------------------
   * Normalize both language documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeConceptDocument(concept.descriptionBN);

  const descriptionEng = normalizeConceptDocument(concept.descriptionEng);

  /*
   * --------------------------------------------------
   * Remove matching Execution reference
   * --------------------------------------------------
   */

  const nextDescriptionBN = descriptionBN.filter(
    (item) => getExecutionId(item) !== executionId,
  );

  const nextDescriptionEng = descriptionEng.filter(
    (item) => getExecutionId(item) !== executionId,
  );

  /*
   * --------------------------------------------------
   * Nothing changed
   * --------------------------------------------------
   */

  if (
    nextDescriptionBN.length === descriptionBN.length &&
    nextDescriptionEng.length === descriptionEng.length
  ) {
    return concept;
  }

  /*
   * --------------------------------------------------
   * Persist both language documents
   * --------------------------------------------------
   */

  return prisma.orm.public.Concept.where({
    id: conceptId,
  }).update({
    descriptionBN: nextDescriptionBN,
    descriptionEng: nextDescriptionEng,
  });
}

/**
 * ================================================================
 * CREATE CONCEPT
 * ================================================================
 *
 * Flow:
 *
 * 1. Verify parent Lesson.
 * 2. Normalize descriptionBN / descriptionEng.
 * 3. Create Concept.
 * 4. Add Concept reference to the parent Lesson's
 *    descriptionBN and descriptionEng.
 *
 * Example parent Lesson document:
 *
 * [
 *   {
 *     type: "text",
 *     content: "Introduction"
 *   },
 *   {
 *     type: "concept",
 *     conceptID: 81
 *   },
 *   {
 *     type: "heading",
 *     content: "Next topic"
 *   }
 * ]
 *
 * The actual Concept data remains in the Concept table.
 *
 * If synchronization with the parent Lesson fails after
 * Concept creation, the newly-created Concept is removed
 * so an unreferenced Concept is not left behind.
 */

export async function createConcept(data: CreateConceptInput) {
  /*
   * --------------------------------------------------
   * Verify parent Lesson
   * --------------------------------------------------
   */

  const lesson = await prisma.orm.public.Lesson.first({
    id: data.lessonId,
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  /*
   * --------------------------------------------------
   * Prepare documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeConceptDocument(data.descriptionBN);

  const descriptionEng = normalizeConceptDocument(data.descriptionEng);

  /*
   * --------------------------------------------------
   * Create Concept
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * No `structure` field is written.
   */

  const concept = await prisma.orm.public.Concept.create({
    lessonId: data.lessonId,

    nameBN: data.nameBN,

    nameEng: data.nameEng,

    descriptionBN,

    descriptionEng,
  });

  /*
   * --------------------------------------------------
   * Synchronize parent Lesson document
   * --------------------------------------------------
   *
   * lesson.service.ts is already responsible for
   * adding:
   *
   * {
   *   type: "concept",
   *   conceptID: concept.id
   * }
   *
   * to both Lesson language documents.
   */

  try {
    await appendConceptToLessonStructure(data.lessonId, concept.id);
  } catch (error) {
    /*
     * ------------------------------------------------
     * Roll back Concept creation
     * ------------------------------------------------
     */

    try {
      await prisma.orm.public.Concept.where({
        id: concept.id,
      }).delete();
    } catch {
      /*
       * Preserve the original
       * structure synchronization error.
       */
    }

    throw error;
  }

  return concept;
}

/**
 * ================================================================
 * GET CONCEPTS
 * ================================================================
 *
 * Optional Lesson filter:
 *
 * getConcepts(lessonId)
 *
 * Without a Lesson filter:
 *
 * getConcepts()
 *
 * This function is for CRUD/listing operations.
 *
 * The Knowledge Graph uses the parent Lesson's ordered
 * description document to determine document placement.
 */

export async function getConcepts(lessonId?: number) {
  if (lessonId !== undefined) {
    return prisma.orm.public.Concept.where({
      lessonId,
    })
      .orderBy((concept) => concept.id.asc())
      .all();
  }

  return prisma.orm.public.Concept.orderBy((concept) => concept.id.asc()).all();
}

/**
 * ================================================================
 * GET SINGLE CONCEPT
 * ================================================================
 */

export async function getConcept(id: number) {
  return prisma.orm.public.Concept.first({
    id,
  });
}

/**
 * ================================================================
 * UPDATE CONCEPT
 * ================================================================
 *
 * Updates:
 *
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * There is no Concept.structure to update.
 *
 * The parent Lesson's Concept reference remains valid because
 * the Concept primary key does not change.
 */

export async function updateConcept(id: number, data: UpdateConceptInput) {
  /*
   * --------------------------------------------------
   * Find Concept
   * --------------------------------------------------
   */

  const concept = await prisma.orm.public.Concept.first({
    id,
  });

  if (!concept) {
    return null;
  }

  /*
   * --------------------------------------------------
   * Normalize documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeConceptDocument(data.descriptionBN);

  const descriptionEng = normalizeConceptDocument(data.descriptionEng);

  /*
   * --------------------------------------------------
   * Update Concept entity
   * --------------------------------------------------
   */

  return prisma.orm.public.Concept.where({
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
 * SET COMPLETE CONCEPT DOCUMENT
 * ================================================================
 *
 * Compatibility helper for callers that still use the old
 * `setConceptStructure()` function name.
 *
 * IMPORTANT:
 *
 * This now writes descriptionBN and descriptionEng.
 *
 * If English is omitted, the existing English document is
 * preserved.
 */

export async function setConceptStructure(
  conceptId: number,
  descriptionBN: ConceptDocument,
  descriptionEng?: ConceptDocument,
) {
  /*
   * --------------------------------------------------
   * Find Concept
   * --------------------------------------------------
   */

  const concept = await prisma.orm.public.Concept.first({
    id: conceptId,
  });

  if (!concept) {
    return null;
  }

  /*
   * --------------------------------------------------
   * Normalize Bangla document
   * --------------------------------------------------
   */

  const normalizedDescriptionBN = normalizeConceptDocument(descriptionBN);

  /*
   * --------------------------------------------------
   * Normalize English document
   * --------------------------------------------------
   *
   * If English is not supplied, preserve the existing
   * English document.
   */

  const normalizedDescriptionEng =
    descriptionEng !== undefined
      ? normalizeConceptDocument(descriptionEng)
      : normalizeConceptDocument(concept.descriptionEng);

  /*
   * --------------------------------------------------
   * Persist both language documents
   * --------------------------------------------------
   */

  return prisma.orm.public.Concept.where({
    id: conceptId,
  }).update({
    descriptionBN: normalizedDescriptionBN,

    descriptionEng: normalizedDescriptionEng,
  });
}

/**
 * ================================================================
 * DELETE CONCEPT
 * ================================================================
 *
 * Flow:
 *
 * 1. Find Concept.
 * 2. Read its parent Lesson ID.
 * 3. Remove Concept reference from Lesson.descriptionBN
 *    and Lesson.descriptionEng.
 * 4. Delete Concept entity.
 *
 * CQ / MCQ records are intentionally NOT touched.
 *
 * Questions are connected records, not hierarchy children.
 *
 * Execution records are also NOT manually deleted here.
 *
 * Their behavior is governed by the relational database contract.
 */

export async function deleteConcept(id: number) {
  /*
   * --------------------------------------------------
   * Find Concept
   * --------------------------------------------------
   */

  const concept = await prisma.orm.public.Concept.first({
    id,
  });

  if (!concept) {
    return null;
  }

  /*
   * --------------------------------------------------
   * Remove Concept from parent Lesson document
   * --------------------------------------------------
   *
   * lesson.service.ts removes:
   *
   * {
   *   type: "concept",
   *   conceptID: concept.id
   * }
   *
   * from both language documents.
   */

  await removeConceptFromLessonStructure(concept.lessonId, concept.id);

  /*
   * --------------------------------------------------
   * Delete Concept entity
   * --------------------------------------------------
   *
   * CQ / MCQ records remain untouched.
   */

  return prisma.orm.public.Concept.where({
    id,
  }).delete();
}

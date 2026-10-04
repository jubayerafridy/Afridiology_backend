import type { Request, Response } from "express";

import {
  createConcept,
  deleteConcept,
  getConcept,
  getConcepts,
  updateConcept,
} from "./concept.service.js";

import type {
  CreateConceptInput,
  UpdateConceptInput,
} from "./concept.service.js";

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
 * JSON VALIDATION
 * ================================================================
 */

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function parseJsonValue(value: unknown): JsonValue | null {
  if (!isJsonValue(value)) {
    return null;
  }

  return value;
}

/**
 * ================================================================
 * CONCEPT DOCUMENT VALIDATION
 * ================================================================
 *
 * Concept.descriptionBN and Concept.descriptionEng are ordered
 * JSON documents.
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
 *     "content": "Next section"
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - There is NO `structure`.
 * - There is NO `flow`.
 * - There is NO artificial block ID.
 * - Array order is the source of truth.
 *
 * Only `type` is required on a document item.
 */

function parseConceptDocument(value: unknown): JsonValue[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const document: JsonValue[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }

    const candidate = item as Record<string, unknown>;

    if (
      typeof candidate.type !== "string" ||
      candidate.type.trim().length === 0
    ) {
      return null;
    }

    /*
     * Validate every additional property
     * as JSON.
     *
     * This allows:
     *
     * {
     *   type: "text",
     *   content: "Hello"
     * }
     *
     * and:
     *
     * {
     *   type: "execution",
     *   executionID: 51
     * }
     *
     * without requiring an artificial ID.
     */

    for (const [key, propertyValue] of Object.entries(candidate)) {
      if (key === "type") {
        continue;
      }

      if (!isJsonValue(propertyValue)) {
        return null;
      }
    }

    document.push(candidate as JsonValue);
  }

  return document;
}

/**
 * ================================================================
 * CREATE CONCEPT
 * ================================================================
 *
 * POST /admin/concepts
 *
 * concept.service.ts handles:
 *
 * 1. Verifying the parent Lesson.
 * 2. Creating the Concept.
 * 3. Saving descriptionBN / descriptionEng.
 * 4. Adding the Concept reference to the parent Lesson's
 *    descriptionBN and descriptionEng.
 *
 * No `structure` field is accepted.
 */

export async function createConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const { lessonId, nameBN, nameEng, descriptionBN, descriptionEng } =
    req.body as {
      lessonId?: unknown;
      nameBN?: unknown;
      nameEng?: unknown;
      descriptionBN?: unknown;
      descriptionEng?: unknown;
    };

  /*
   * --------------------------------------------------
   * Validate lessonId
   * --------------------------------------------------
   */

  const parsedLessonId = Number(lessonId);

  if (!Number.isInteger(parsedLessonId) || parsedLessonId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid lessonId is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla concept name
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla concept name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English concept name
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English concept name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla description
   * --------------------------------------------------
   */

  const parsedDescriptionBN = parseConceptDocument(descriptionBN);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla concept description array is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English description
   * --------------------------------------------------
   */

  const parsedDescriptionEng = parseConceptDocument(descriptionEng);

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English concept description array is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Create Concept
   * --------------------------------------------------
   */

  try {
    const conceptInput: CreateConceptInput = {
      lessonId: parsedLessonId,

      nameBN: nameBN.trim(),

      nameEng: nameEng.trim(),

      descriptionBN: parsedDescriptionBN,

      descriptionEng: parsedDescriptionEng,
    };

    const concept = await createConcept(conceptInput);

    res.status(201).json({
      success: true,
      message: "Concept created successfully",
      data: concept,
    });
  } catch (error) {
    /*
     * --------------------------------------------------
     * Parent Lesson not found
     * --------------------------------------------------
     */

    if (error instanceof Error && error.message === "Lesson not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    throw error;
  }
}

/**
 * ================================================================
 * GET CONCEPTS
 * ================================================================
 *
 * Optional:
 *
 * GET /admin/concepts?lessonId=123
 *
 * Without lessonId:
 *
 * GET /admin/concepts
 *
 * This endpoint is for CRUD/listing purposes.
 *
 * The Knowledge Graph does not use database ID ordering
 * as document order.
 *
 * Document order comes from the parent Lesson's
 * descriptionBN / descriptionEng arrays.
 */

export async function getConceptsController(
  req: Request,
  res: Response,
): Promise<void> {
  const lessonIdValue = req.query.lessonId;

  let lessonId: number | undefined;

  if (lessonIdValue !== undefined) {
    lessonId = Number(lessonIdValue);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid lessonId",
      });

      return;
    }
  }

  const concepts = await getConcepts(lessonId);

  res.status(200).json({
    success: true,
    data: concepts,
  });
}

/**
 * ================================================================
 * GET SINGLE CONCEPT
 * ================================================================
 */

export async function getConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid concept ID",
    });

    return;
  }

  const concept = await getConcept(id);

  if (!concept) {
    res.status(404).json({
      success: false,
      message: "Concept not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: concept,
  });
}

/**
 * ================================================================
 * UPDATE CONCEPT
 * ================================================================
 *
 * PUT /admin/concepts/:id
 *
 * Updates:
 *
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * No `structure` field is accepted.
 *
 * Updating the Concept does not change the parent Lesson's
 * Concept reference because the Concept ID remains unchanged.
 */

export async function updateConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid concept ID",
    });

    return;
  }

  const { nameBN, nameEng, descriptionBN, descriptionEng } = req.body as {
    nameBN?: unknown;
    nameEng?: unknown;
    descriptionBN?: unknown;
    descriptionEng?: unknown;
  };

  /*
   * --------------------------------------------------
   * Validate Bangla concept name
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla concept name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English concept name
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English concept name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla description
   * --------------------------------------------------
   */

  const parsedDescriptionBN = parseConceptDocument(descriptionBN);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla concept description array is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English description
   * --------------------------------------------------
   */

  const parsedDescriptionEng = parseConceptDocument(descriptionEng);

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English concept description array is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Update Concept
   * --------------------------------------------------
   */

  const conceptInput: UpdateConceptInput = {
    nameBN: nameBN.trim(),

    nameEng: nameEng.trim(),

    descriptionBN: parsedDescriptionBN,

    descriptionEng: parsedDescriptionEng,
  };

  const concept = await updateConcept(id, conceptInput);

  if (!concept) {
    res.status(404).json({
      success: false,
      message: "Concept not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Concept updated successfully",
    data: concept,
  });
}

/**
 * ================================================================
 * DELETE CONCEPT
 * ================================================================
 *
 * concept.service.ts handles:
 *
 * 1. Finding the Concept.
 * 2. Removing its reference from the parent Lesson's
 *    descriptionBN and descriptionEng.
 * 3. Deleting the Concept entity.
 *
 * Connected CQ / MCQ records are intentionally NOT deleted.
 *
 * Questions are independent connected records rather than
 * hierarchy children.
 */

export async function deleteConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid concept ID",
    });

    return;
  }

  const deletedConcept = await deleteConcept(id);

  if (!deletedConcept) {
    res.status(404).json({
      success: false,
      message: "Concept not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Concept deleted successfully",
    data: deletedConcept,
  });
}

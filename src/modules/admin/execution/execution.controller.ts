import type { Request, Response } from "express";

import {
  createExecution,
  deleteExecution,
  getExecution,
  getExecutions,
  updateExecution,
} from "./execution.service.js";

import type {
  CreateExecutionInput,
  ExecutionDocument,
  ExecutionDocumentItem,
  UpdateExecutionInput,
} from "./execution.service.js";

/**
 * ================================================================
 * JSON TYPES
 * ================================================================
 */

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * ================================================================
 * UUID HELPERS
 * ================================================================
 */

function parseUuid(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

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

  if (typeof value === "object") {
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
 * EXECUTION DOCUMENT VALIDATION
 * ================================================================
 *
 * Execution owns two ordered bilingual documents:
 *
 *   descriptionBN
 *   descriptionEng
 *
 * Example:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "..."
 *   },
 *   {
 *     "type": "heading",
 *     "content": "..."
 *   },
 *   {
 *     "type": "table",
 *     "tableID": 12
 *   }
 * ]
 *
 * Rules:
 *
 * - document must be an array
 * - every item must be an object
 * - every item must contain a non-empty string `type`
 * - all other properties must contain valid JSON values
 *
 * There is NO block ID.
 *
 * Array order is the source of truth.
 *
 * There is NO `structure` field.
 */

function parseExecutionDocument(value: unknown): ExecutionDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const document: ExecutionDocument = [];

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

    for (const [key, propertyValue] of Object.entries(candidate)) {
      if (key === "type") {
        continue;
      }

      if (!isJsonValue(propertyValue)) {
        return null;
      }
    }

    document.push(candidate as ExecutionDocumentItem);
  }

  return document;
}

/**
 * ================================================================
 * CREATE EXECUTION
 * ================================================================
 *
 * The controller validates the request.
 *
 * execution.service.ts handles:
 *
 * 1. Verifying the parent Concept.
 * 2. Creating the Execution.
 * 3. Getting the generated Execution ID.
 * 4. Adding the Execution reference to:
 *
 *      Concept.descriptionBN
 *      Concept.descriptionEng
 */

export async function createExecutionController(
  req: Request,
  res: Response,
): Promise<void> {
  const { conceptId, nameBN, nameEng, descriptionBN, descriptionEng } =
    req.body as {
      conceptId?: unknown;
      nameBN?: unknown;
      nameEng?: unknown;
      descriptionBN?: unknown;
      descriptionEng?: unknown;
    };

  /**
   * --------------------------------------------------
   * Validate conceptId
   * --------------------------------------------------
   */

  const parsedConceptId = parseUuid(conceptId);

  if (parsedConceptId === null) {
    res.status(400).json({
      success: false,
      message: "Valid conceptId is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate Bangla execution name
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla execution name is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate English execution name
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English execution name is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate Bangla document
   * --------------------------------------------------
   */

  const parsedDescriptionBN = parseExecutionDocument(descriptionBN);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla execution description is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate English document
   * --------------------------------------------------
   */

  const parsedDescriptionEng = parseExecutionDocument(descriptionEng);

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English execution description is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Build input
   * --------------------------------------------------
   */

  const executionInput: CreateExecutionInput = {
    conceptId: parsedConceptId,
    nameBN: nameBN.trim(),
    nameEng: nameEng.trim(),
    descriptionBN: parsedDescriptionBN,
    descriptionEng: parsedDescriptionEng,
  };

  /**
   * --------------------------------------------------
   * Create Execution
   * --------------------------------------------------
   */

  try {
    const execution = await createExecution(executionInput);

    res.status(201).json({
      success: true,
      message: "Execution created successfully",
      data: execution,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Concept not found") {
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
 * GET EXECUTIONS
 * ================================================================
 *
 * GET /admin/executions
 *
 * Returns all executions.
 *
 * GET /admin/executions?conceptId=UUID
 *
 * Returns executions belonging to Concept UUID.
 */

export async function getExecutionsController(
  req: Request,
  res: Response,
): Promise<void> {
  const conceptIdValue = req.query.conceptId;

  let conceptId: string | undefined;

  if (conceptIdValue !== undefined) {
    const parsedConceptId = parseUuid(conceptIdValue);

    if (parsedConceptId === null) {
      res.status(400).json({
        success: false,
        message: "Invalid conceptId",
      });

      return;
    }

    conceptId = parsedConceptId;
  }

  const executions = await getExecutions(conceptId);

  res.status(200).json({
    success: true,
    data: executions,
  });
}

/**
 * ================================================================
 * GET SINGLE EXECUTION
 * ================================================================
 *
 * GET /admin/executions/:id
 *
 * This endpoint is required by the admin knowledge graph when
 * editing an Execution.
 *
 * The frontend first reads the current Execution so that it can
 * preserve:
 *
 *   nameBN
 *   nameEng
 *
 * while changing only:
 *
 *   descriptionBN
 *   descriptionEng
 */

export async function getExecutionController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid execution ID",
    });

    return;
  }

  const execution = await getExecution(id);

  if (!execution) {
    res.status(404).json({
      success: false,
      message: "Execution not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: execution,
  });
}

/**
 * ================================================================
 * UPDATE EXECUTION
 * ================================================================
 *
 * PUT /admin/executions/:id
 *
 * Updates:
 *
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * The parent Concept reference remains unchanged.
 */

export async function updateExecutionController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid execution ID",
    });

    return;
  }

  const { nameBN, nameEng, descriptionBN, descriptionEng } = req.body as {
    nameBN?: unknown;
    nameEng?: unknown;
    descriptionBN?: unknown;
    descriptionEng?: unknown;
  };

  /**
   * --------------------------------------------------
   * Validate Bangla name
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla execution name is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate English name
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English execution name is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate Bangla document
   * --------------------------------------------------
   */

  const parsedDescriptionBN = parseExecutionDocument(descriptionBN);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla execution description is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Validate English document
   * --------------------------------------------------
   */

  const parsedDescriptionEng = parseExecutionDocument(descriptionEng);

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English execution description is required",
    });

    return;
  }

  /**
   * --------------------------------------------------
   * Build update input
   * --------------------------------------------------
   */

  const executionInput: UpdateExecutionInput = {
    nameBN: nameBN.trim(),
    nameEng: nameEng.trim(),
    descriptionBN: parsedDescriptionBN,
    descriptionEng: parsedDescriptionEng,
  };

  /**
   * --------------------------------------------------
   * Update Execution
   * --------------------------------------------------
   */

  const execution = await updateExecution(id, executionInput);

  if (!execution) {
    res.status(404).json({
      success: false,
      message: "Execution not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Execution updated successfully",
    data: execution,
  });
}

/**
 * ================================================================
 * DELETE EXECUTION
 * ================================================================
 *
 * DELETE /admin/executions/:id
 *
 * The service:
 *
 * 1. Finds the Execution.
 * 2. Removes its reference from:
 *
 *      Concept.descriptionBN
 *      Concept.descriptionEng
 *
 * 3. Deletes the Execution.
 *
 * CQ / MCQ records remain untouched.
 */

export async function deleteExecutionController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid execution ID",
    });

    return;
  }

  const deletedExecution = await deleteExecution(id);

  if (!deletedExecution) {
    res.status(404).json({
      success: false,
      message: "Execution not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Execution deleted successfully",
    data: deletedExecution,
  });
}

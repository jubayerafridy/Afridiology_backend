import type { Request, Response } from "express";

import {
  createExecution,
  deleteExecution,
  getExecutions,
} from "./execution.service.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

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

  const parsedConceptId = Number(conceptId);

  if (!Number.isInteger(parsedConceptId) || parsedConceptId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid conceptId is required",
    });

    return;
  }

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla execution name is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English execution name is required",
    });

    return;
  }

  const parsedDescriptionBN = parseJsonValue(descriptionBN);
  const parsedDescriptionEng = parseJsonValue(descriptionEng);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla execution description is required",
    });

    return;
  }

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English execution description is required",
    });

    return;
  }

  try {
    const execution = await createExecution({
      conceptId: parsedConceptId,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: parsedDescriptionBN,
      descriptionEng: parsedDescriptionEng,
    });

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

export async function getExecutionsController(
  req: Request,
  res: Response,
): Promise<void> {
  const conceptIdValue = req.query.conceptId;

  let conceptId: number | undefined;

  if (conceptIdValue !== undefined) {
    conceptId = Number(conceptIdValue);

    if (!Number.isInteger(conceptId) || conceptId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid conceptId",
      });

      return;
    }
  }

  const executions = await getExecutions(conceptId);

  res.status(200).json({
    success: true,
    data: executions,
  });
}

export async function deleteExecutionController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
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

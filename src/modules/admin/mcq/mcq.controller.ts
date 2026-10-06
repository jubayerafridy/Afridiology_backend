import type { Request, Response } from "express";

import {
  createMCQ,
  deleteMCQ,
  getMCQ,
  getMCQs,
  updateMCQ,
  type CreateMCQInput,
  type KnowledgeLinkType,
  type UpdateMCQInput,
} from "./mcq.service.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function parseOptionalPositiveInt(
  value: unknown,
  fieldName: string,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePositiveInt(value, fieldName);
}

function parseBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be true or false`);
  }

  return value;
}

function parseKnowledgeLinkType(value: unknown): KnowledgeLinkType | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (
    value !== "CHAPTER" &&
    value !== "LESSON" &&
    value !== "CONCEPT" &&
    value !== "EXECUTION"
  ) {
    throw new Error(
      "Knowledge link type must be CHAPTER, LESSON, CONCEPT, or EXECUTION",
    );
  }

  return value;
}

function parseNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Value must be a string");
  }

  return value;
}

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

function parseRequiredJsonValue(value: unknown, fieldName: string): JsonValue {
  if (!isJsonValue(value)) {
    throw new Error(`${fieldName} is required and must contain valid JSON`);
  }

  return value;
}

function parseOptionalJsonValue(
  value: unknown,
  fieldName: string,
): JsonValue | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!isJsonValue(value)) {
    throw new Error(`${fieldName} must contain valid JSON`);
  }

  return value;
}

function hasOwn(body: Record<string, unknown>, fieldName: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, fieldName);
}

function buildLink(body: Record<string, unknown>): {
  type: KnowledgeLinkType | null;
  id: number | null;
} {
  return {
    type: parseKnowledgeLinkType(body.linkType),
    id: parseOptionalPositiveInt(body.linkId, "linkId"),
  };
}

/**
 * Build the complete MCQ payload used during creation.
 *
 * Rules:
 * - questionPaperId optional
 * - qusNo optional
 * - isActive optional
 * - descriptionBN required
 * - descriptionEng required
 * - optionsBN required
 * - optionsEng required
 * - rightAns required
 * - explanationBN optional
 * - explanationEng optional
 * - linkType + linkId optional
 * - ytLink optional
 */
function buildCreateInput(body: Record<string, unknown>): CreateMCQInput {
  const link = buildLink(body);

  const data: CreateMCQInput = {
    isActive: false,

    imageUrl: parseNullableString(body.imageUrl),

    descriptionBN: parseRequiredJsonValue(body.descriptionBN, "descriptionBN"),

    descriptionEng: parseRequiredJsonValue(
      body.descriptionEng,
      "descriptionEng",
    ),

    rightAns: parsePositiveInt(body.rightAns, "rightAns"),

    linkType: link.type,
    linkId: link.id,

    questionPaperId: parseOptionalPositiveInt(
      body.questionPaperId,
      "questionPaperId",
    ),

    qusNo: parseOptionalPositiveInt(body.qusNo, "qusNo"),

    optionsBN: parseRequiredJsonValue(body.optionsBN, "optionsBN"),

    optionsEng: parseRequiredJsonValue(body.optionsEng, "optionsEng"),

    ytLink: parseNullableString(body.ytLink),
  };

  /*
   * Optional explanation fields are only added when
   * the client actually supplied them.
   *
   * This is required because exactOptionalPropertyTypes
   * is enabled in the project.
   */
  if (hasOwn(body, "explanationBN")) {
    const explanationBN = parseOptionalJsonValue(
      body.explanationBN,
      "explanationBN",
    );

    if (explanationBN !== undefined) {
      data.explanationBN = explanationBN;
    }
  }

  if (hasOwn(body, "explanationEng")) {
    const explanationEng = parseOptionalJsonValue(
      body.explanationEng,
      "explanationEng",
    );

    if (explanationEng !== undefined) {
      data.explanationEng = explanationEng;
    }
  }

  /*
   * Only assign isActive when the client actually
   * supplied it.
   *
   * If omitted, the service uses false for a new MCQ.
   */
  if (hasOwn(body, "isActive")) {
    data.isActive = parseBoolean(body.isActive, "isActive");
  }

  return data;
}

/**
 * Build a PARTIAL MCQ update.
 *
 * Only fields actually supplied by the client
 * are included.
 */
function buildUpdateInput(body: Record<string, unknown>): UpdateMCQInput {
  const data: UpdateMCQInput = {};

  if (hasOwn(body, "isActive")) {
    data.isActive = parseBoolean(body.isActive, "isActive");
  }

  if (hasOwn(body, "imageUrl")) {
    data.imageUrl = parseNullableString(body.imageUrl);
  }

  if (hasOwn(body, "descriptionBN")) {
    const descriptionBN = parseOptionalJsonValue(
      body.descriptionBN,
      "descriptionBN",
    );

    if (descriptionBN !== undefined) {
      data.descriptionBN = descriptionBN;
    }
  }

  if (hasOwn(body, "descriptionEng")) {
    const descriptionEng = parseOptionalJsonValue(
      body.descriptionEng,
      "descriptionEng",
    );

    if (descriptionEng !== undefined) {
      data.descriptionEng = descriptionEng;
    }
  }

  if (hasOwn(body, "rightAns")) {
    data.rightAns = parsePositiveInt(body.rightAns, "rightAns");
  }

  if (hasOwn(body, "explanationBN")) {
    const explanationBN = parseOptionalJsonValue(
      body.explanationBN,
      "explanationBN",
    );

    if (explanationBN !== undefined) {
      data.explanationBN = explanationBN;
    }
  }

  if (hasOwn(body, "explanationEng")) {
    const explanationEng = parseOptionalJsonValue(
      body.explanationEng,
      "explanationEng",
    );

    if (explanationEng !== undefined) {
      data.explanationEng = explanationEng;
    }
  }

  if (hasOwn(body, "linkType")) {
    data.linkType = parseKnowledgeLinkType(body.linkType);
  }

  if (hasOwn(body, "linkId")) {
    data.linkId = parseOptionalPositiveInt(body.linkId, "linkId");
  }

  if (hasOwn(body, "questionPaperId")) {
    data.questionPaperId = parseOptionalPositiveInt(
      body.questionPaperId,
      "questionPaperId",
    );
  }

  if (hasOwn(body, "qusNo")) {
    data.qusNo = parseOptionalPositiveInt(body.qusNo, "qusNo");
  }

  if (hasOwn(body, "optionsBN")) {
    const optionsBN = parseOptionalJsonValue(body.optionsBN, "optionsBN");

    if (optionsBN !== undefined) {
      data.optionsBN = optionsBN;
    }
  }

  if (hasOwn(body, "optionsEng")) {
    const optionsEng = parseOptionalJsonValue(body.optionsEng, "optionsEng");

    if (optionsEng !== undefined) {
      data.optionsEng = optionsEng;
    }
  }

  if (hasOwn(body, "ytLink")) {
    data.ytLink = parseNullableString(body.ytLink);
  }

  return data;
}

function getRequestBody(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new Error("Request body must be an object");
  }

  return req.body as Record<string, unknown>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal server error";
}

export async function createMCQController(req: Request, res: Response) {
  try {
    const body = getRequestBody(req);

    const data = buildCreateInput(body);

    const mcq = await createMCQ(data);

    res.status(201).json({
      success: true,
      data: mcq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getMCQsController(req: Request, res: Response) {
  try {
    const questionPaperId =
      req.query.questionPaperId !== undefined
        ? parsePositiveInt(req.query.questionPaperId, "questionPaperId")
        : undefined;

    const mcqs = await getMCQs(questionPaperId);

    res.status(200).json({
      success: true,
      data: mcqs,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getMCQController(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id, "id");

    const mcq = await getMCQ(id);

    if (!mcq) {
      res.status(404).json({
        success: false,
        message: "MCQ not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: mcq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function updateMCQController(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id, "id");

    const body = getRequestBody(req);

    const data = buildUpdateInput(body);

    const mcq = await updateMCQ(id, data);

    if (!mcq) {
      res.status(404).json({
        success: false,
        message: "MCQ not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: mcq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function deleteMCQController(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id, "id");

    const mcq = await deleteMCQ(id);

    if (!mcq) {
      res.status(404).json({
        success: false,
        message: "MCQ not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: mcq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

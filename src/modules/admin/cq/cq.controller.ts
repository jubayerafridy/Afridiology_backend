import type { Request, Response } from "express";

import {
  createCQ,
  deleteCQ,
  getCQ,
  getCQs,
  updateCQ,
  type CreateCQInput,
  type KnowledgeLinkType,
  type UpdateCQInput,
} from "./cq.service.js";

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

function parseOptionalNonNegativeInt(
  value: unknown,
  fieldName: string,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }

  return parsed;
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

function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required`);
  }

  if (!value.trim()) {
    throw new Error(`${fieldName} is required`);
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
): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isJsonValue(value)) {
    throw new Error(`${fieldName} must contain valid JSON`);
  }

  return value;
}

function hasOwn(body: Record<string, unknown>, fieldName: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, fieldName);
}

function buildLink(
  body: Record<string, unknown>,
  typeField: string,
  idField: string,
) {
  return {
    type: parseKnowledgeLinkType(body[typeField]),
    id: parseOptionalPositiveInt(body[idField], idField),
  };
}

/**
 * Build the complete CQ payload used during creation.
 *
 * Rules:
 * - questionPaperId required
 * - qusNo optional
 * - point optional
 * - isActive optional
 * - stimulus JSON required
 * - Ka/Kha/Ga required
 * - Gha optional
 */
function buildCreateInput(body: Record<string, unknown>): CreateCQInput {
  const kaLink = buildLink(body, "quesKaLinkType", "quesKaLinkId");

  const khaLink = buildLink(body, "quesKhaLinkType", "quesKhaLinkId");

  const gaLink = buildLink(body, "quesGaLinkType", "quesGaLinkId");

  const ghaLink = buildLink(body, "quesGhaLinkType", "quesGhaLinkId");

  const data: CreateCQInput = {
    questionPaperId: parsePositiveInt(body.questionPaperId, "questionPaperId"),

    qusNo: parseOptionalPositiveInt(body.qusNo, "qusNo"),

    point: parseOptionalNonNegativeInt(body.point, "point"),

    descriptionBN: parseRequiredJsonValue(body.descriptionBN, "descriptionBN"),

    descriptionEng: parseRequiredJsonValue(
      body.descriptionEng,
      "descriptionEng",
    ),

    quesUddipok: parseNullableString(body.quesUddipok),

    imageUrl: parseNullableString(body.imageUrl),

    // ক
    quesKaBN: parseRequiredString(body.quesKaBN, "quesKaBN"),

    quesKaEng: parseRequiredString(body.quesKaEng, "quesKaEng"),

    quesKaLinkType: kaLink.type,

    quesKaLinkId: kaLink.id,

    ansKaBN: parseNullableString(body.ansKaBN),

    ansKaEng: parseNullableString(body.ansKaEng),

    // খ
    quesKhaBN: parseRequiredString(body.quesKhaBN, "quesKhaBN"),

    quesKhaEng: parseRequiredString(body.quesKhaEng, "quesKhaEng"),

    quesKhaLinkType: khaLink.type,

    quesKhaLinkId: khaLink.id,

    ansKhaBN: parseNullableString(body.ansKhaBN),

    ansKhaEng: parseNullableString(body.ansKhaEng),

    // গ
    quesGaBN: parseRequiredString(body.quesGaBN, "quesGaBN"),

    quesGaEng: parseRequiredString(body.quesGaEng, "quesGaEng"),

    quesGaLinkType: gaLink.type,

    quesGaLinkId: gaLink.id,

    ansGaBN: parseNullableString(body.ansGaBN),

    ansGaEng: parseNullableString(body.ansGaEng),

    // ঘ — optional
    quesGhaBN: parseNullableString(body.quesGhaBN),

    quesGhaEng: parseNullableString(body.quesGhaEng),

    quesGhaLinkType: ghaLink.type,

    quesGhaLinkId: ghaLink.id,

    ansGhaBN: parseNullableString(body.ansGhaBN),

    ansGhaEng: parseNullableString(body.ansGhaEng),
  };

  /**
   * With exactOptionalPropertyTypes enabled,
   * only assign isActive when the client actually
   * supplied it.
   *
   * If omitted, the service uses false for a new CQ.
   */
  if (hasOwn(body, "isActive")) {
    data.isActive = parseBoolean(body.isActive, "isActive");
  }

  return data;
}

/**
 * Build a PARTIAL CQ update.
 *
 * Only fields actually supplied by the client
 * are included.
 *
 * This allows independent updates such as:
 * - serial only
 * - point only
 * - active/inactive only
 * - stimulus only
 * - Ka only
 * - Kha only
 * - Ga only
 * - Gha only
 * - answer only
 * - clearing nullable values
 */
function buildUpdateInput(body: Record<string, unknown>): UpdateCQInput {
  const data: UpdateCQInput = {};

  if (hasOwn(body, "questionPaperId")) {
    data.questionPaperId = parsePositiveInt(
      body.questionPaperId,
      "questionPaperId",
    );
  }

  if (hasOwn(body, "qusNo")) {
    data.qusNo = parseOptionalPositiveInt(body.qusNo, "qusNo");
  }

  if (hasOwn(body, "point")) {
    data.point = parseOptionalNonNegativeInt(body.point, "point");
  }

  /**
   * Each CQ controls its own active state.
   *
   * true  -> this CQ becomes active
   * false -> this CQ becomes inactive
   */
  if (hasOwn(body, "isActive")) {
    data.isActive = parseBoolean(body.isActive, "isActive");
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

  if (hasOwn(body, "quesUddipok")) {
    data.quesUddipok = parseNullableString(body.quesUddipok);
  }

  if (hasOwn(body, "imageUrl")) {
    data.imageUrl = parseNullableString(body.imageUrl);
  }

  // ক
  if (hasOwn(body, "quesKaBN")) {
    data.quesKaBN = parseRequiredString(body.quesKaBN, "quesKaBN");
  }

  if (hasOwn(body, "quesKaEng")) {
    data.quesKaEng = parseRequiredString(body.quesKaEng, "quesKaEng");
  }

  if (hasOwn(body, "quesKaLinkType")) {
    data.quesKaLinkType = parseKnowledgeLinkType(body.quesKaLinkType);
  }

  if (hasOwn(body, "quesKaLinkId")) {
    data.quesKaLinkId = parseOptionalPositiveInt(
      body.quesKaLinkId,
      "quesKaLinkId",
    );
  }

  if (hasOwn(body, "ansKaBN")) {
    data.ansKaBN = parseNullableString(body.ansKaBN);
  }

  if (hasOwn(body, "ansKaEng")) {
    data.ansKaEng = parseNullableString(body.ansKaEng);
  }

  // খ
  if (hasOwn(body, "quesKhaBN")) {
    data.quesKhaBN = parseRequiredString(body.quesKhaBN, "quesKhaBN");
  }

  if (hasOwn(body, "quesKhaEng")) {
    data.quesKhaEng = parseRequiredString(body.quesKhaEng, "quesKhaEng");
  }

  if (hasOwn(body, "quesKhaLinkType")) {
    data.quesKhaLinkType = parseKnowledgeLinkType(body.quesKhaLinkType);
  }

  if (hasOwn(body, "quesKhaLinkId")) {
    data.quesKhaLinkId = parseOptionalPositiveInt(
      body.quesKhaLinkId,
      "quesKhaLinkId",
    );
  }

  if (hasOwn(body, "ansKhaBN")) {
    data.ansKhaBN = parseNullableString(body.ansKhaBN);
  }

  if (hasOwn(body, "ansKhaEng")) {
    data.ansKhaEng = parseNullableString(body.ansKhaEng);
  }

  // গ
  if (hasOwn(body, "quesGaBN")) {
    data.quesGaBN = parseRequiredString(body.quesGaBN, "quesGaBN");
  }

  if (hasOwn(body, "quesGaEng")) {
    data.quesGaEng = parseRequiredString(body.quesGaEng, "quesGaEng");
  }

  if (hasOwn(body, "quesGaLinkType")) {
    data.quesGaLinkType = parseKnowledgeLinkType(body.quesGaLinkType);
  }

  if (hasOwn(body, "quesGaLinkId")) {
    data.quesGaLinkId = parseOptionalPositiveInt(
      body.quesGaLinkId,
      "quesGaLinkId",
    );
  }

  if (hasOwn(body, "ansGaBN")) {
    data.ansGaBN = parseNullableString(body.ansGaBN);
  }

  if (hasOwn(body, "ansGaEng")) {
    data.ansGaEng = parseNullableString(body.ansGaEng);
  }

  // ঘ — optional
  if (hasOwn(body, "quesGhaBN")) {
    data.quesGhaBN = parseNullableString(body.quesGhaBN);
  }

  if (hasOwn(body, "quesGhaEng")) {
    data.quesGhaEng = parseNullableString(body.quesGhaEng);
  }

  if (hasOwn(body, "quesGhaLinkType")) {
    data.quesGhaLinkType = parseKnowledgeLinkType(body.quesGhaLinkType);
  }

  if (hasOwn(body, "quesGhaLinkId")) {
    data.quesGhaLinkId = parseOptionalPositiveInt(
      body.quesGhaLinkId,
      "quesGhaLinkId",
    );
  }

  if (hasOwn(body, "ansGhaBN")) {
    data.ansGhaBN = parseNullableString(body.ansGhaBN);
  }

  if (hasOwn(body, "ansGhaEng")) {
    data.ansGhaEng = parseNullableString(body.ansGhaEng);
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

export async function createCQController(req: Request, res: Response) {
  try {
    const body = getRequestBody(req);

    const data = buildCreateInput(body);

    const cq = await createCQ(data);

    res.status(201).json({
      success: true,
      data: cq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getCQsController(req: Request, res: Response) {
  try {
    const questionPaperId =
      req.query.questionPaperId !== undefined
        ? parsePositiveInt(req.query.questionPaperId, "questionPaperId")
        : undefined;

    const cqs = await getCQs(questionPaperId);

    res.status(200).json({
      success: true,
      data: cqs,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getCQController(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id, "id");

    const cq = await getCQ(id);

    if (!cq) {
      res.status(404).json({
        success: false,
        message: "CQ not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: cq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function updateCQController(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id, "id");

    const body = getRequestBody(req);

    const data = buildUpdateInput(body);

    const cq = await updateCQ(id, data);

    if (!cq) {
      res.status(404).json({
        success: false,
        message: "CQ not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: cq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function deleteCQController(req: Request, res: Response) {
  try {
    const id = parsePositiveInt(req.params.id, "id");

    const cq = await deleteCQ(id);

    if (!cq) {
      res.status(404).json({
        success: false,
        message: "CQ not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: cq,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

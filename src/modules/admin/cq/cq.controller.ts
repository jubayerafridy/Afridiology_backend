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

function buildCreateInput(body: Record<string, unknown>): CreateCQInput {
  const kaLink = buildLink(body, "quesKaLinkType", "quesKaLinkId");

  const khaLink = buildLink(body, "quesKhaLinkType", "quesKhaLinkId");

  const gaLink = buildLink(body, "quesGaLinkType", "quesGaLinkId");

  const ghaLink = buildLink(body, "quesGhaLinkType", "quesGhaLinkId");

  return {
    questionPaperId: parsePositiveInt(body.questionPaperId, "questionPaperId"),

    qusNo: parsePositiveInt(body.qusNo, "qusNo"),

    descriptionBN: parseRequiredJsonValue(body.descriptionBN, "descriptionBN"),

    descriptionEng: parseRequiredJsonValue(
      body.descriptionEng,
      "descriptionEng",
    ),

    quesUddipok: parseNullableString(body.quesUddipok),

    imageUrl: parseNullableString(body.imageUrl),

    quesKaBN: parseRequiredString(body.quesKaBN, "quesKaBN"),

    quesKaEng: parseRequiredString(body.quesKaEng, "quesKaEng"),

    quesKaLinkType: kaLink.type,
    quesKaLinkId: kaLink.id,

    ansKaBN: parseNullableString(body.ansKaBN),

    ansKaEng: parseNullableString(body.ansKaEng),

    quesKhaBN: parseRequiredString(body.quesKhaBN, "quesKhaBN"),

    quesKhaEng: parseRequiredString(body.quesKhaEng, "quesKhaEng"),

    quesKhaLinkType: khaLink.type,
    quesKhaLinkId: khaLink.id,

    ansKhaBN: parseNullableString(body.ansKhaBN),

    ansKhaEng: parseNullableString(body.ansKhaEng),

    quesGaBN: parseRequiredString(body.quesGaBN, "quesGaBN"),

    quesGaEng: parseRequiredString(body.quesGaEng, "quesGaEng"),

    quesGaLinkType: gaLink.type,
    quesGaLinkId: gaLink.id,

    ansGaBN: parseNullableString(body.ansGaBN),

    ansGaEng: parseNullableString(body.ansGaEng),

    quesGhaBN: parseRequiredString(body.quesGhaBN, "quesGhaBN"),

    quesGhaEng: parseRequiredString(body.quesGhaEng, "quesGhaEng"),

    quesGhaLinkType: ghaLink.type,
    quesGhaLinkId: ghaLink.id,

    ansGhaBN: parseNullableString(body.ansGhaBN),

    ansGhaEng: parseNullableString(body.ansGhaEng),
  };
}

function buildUpdateInput(body: Record<string, unknown>): UpdateCQInput {
  return buildCreateInput(body);
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

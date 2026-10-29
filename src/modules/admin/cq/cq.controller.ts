import type { Request, Response } from "express";

import {
  createCQ,
  createCQs,
  deleteCQ,
  getCQ,
  getCQs,
  updateCQ,
  updateCQs,
  type CreateCQInput,
  type KnowledgeLinkType,
  type UpdateCQInput,
} from "./cq.service.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

function parseUuid(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }

  return value.trim();
}

function parseOptionalUuid(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parseUuid(value, fieldName);
}

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

function parseNullableJsonValue(
  value: unknown,
  fieldName: string,
): JsonValue | null {
  if (value === undefined || value === null) {
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

function buildLink(
  body: Record<string, unknown>,

  typeField: string,

  idField: string,
) {
  return {
    type: parseKnowledgeLinkType(body[typeField]),

    id: parseOptionalUuid(body[idField], idField),
  };
}

/**

 \\* Build the complete CQ payload used during creation.

 \\*

 \\* Rules:

 \\* - questionPaperId required

 \\* - qusNo optional

 \\* - point optional

 \\* - isActive optional

 \\* - stimulus JSON required

 \\* - Ka/Kha/Ga required

 \\* - Gha optional

 */

function buildCreateInput(body: Record<string, unknown>): CreateCQInput {
  const kaLink = buildLink(body, "quesKaLinkType", "quesKaLinkId");

  const khaLink = buildLink(body, "quesKhaLinkType", "quesKhaLinkId");

  const gaLink = buildLink(body, "quesGaLinkType", "quesGaLinkId");

  const ghaLink = buildLink(body, "quesGhaLinkType", "quesGhaLinkId");

  const data: CreateCQInput = {
    questionPaperId: parseUuid(body.questionPaperId, "questionPaperId"),

    qusNo: parseOptionalPositiveInt(body.qusNo, "qusNo"),

    point: parseOptionalNonNegativeInt(body.point, "point"),

    descriptionBN: parseRequiredJsonValue(body.descriptionBN, "descriptionBN"),

    descriptionEng: parseRequiredJsonValue(
      body.descriptionEng,

      "descriptionEng",
    ),

    quesUddipok: parseNullableString(body.quesUddipok),

    imageUrl: parseNullableString(body.imageUrl),

    ytLink: parseNullableString(body.ytLink),

    // ক

    quesKaBN: parseRequiredString(body.quesKaBN, "quesKaBN"),

    quesKaEng: parseRequiredString(body.quesKaEng, "quesKaEng"),

    quesKaLinkType: kaLink.type,

    quesKaLinkId: kaLink.id,

    ansKaBN: parseNullableJsonValue(body.ansKaBN, "ansKaBN"),

    ansKaEng: parseNullableJsonValue(body.ansKaEng, "ansKaEng"),

    // খ

    quesKhaBN: parseRequiredString(body.quesKhaBN, "quesKhaBN"),

    quesKhaEng: parseRequiredString(body.quesKhaEng, "quesKhaEng"),

    quesKhaLinkType: khaLink.type,

    quesKhaLinkId: khaLink.id,

    ansKhaBN: parseNullableJsonValue(body.ansKhaBN, "ansKhaBN"),

    ansKhaEng: parseNullableJsonValue(body.ansKhaEng, "ansKhaEng"),

    // গ

    quesGaBN: parseRequiredString(body.quesGaBN, "quesGaBN"),

    quesGaEng: parseRequiredString(body.quesGaEng, "quesGaEng"),

    quesGaLinkType: gaLink.type,

    quesGaLinkId: gaLink.id,

    ansGaBN: parseNullableJsonValue(body.ansGaBN, "ansGaBN"),

    ansGaEng: parseNullableJsonValue(body.ansGaEng, "ansGaEng"),

    // ঘ — optional

    quesGhaBN: parseNullableString(body.quesGhaBN),

    quesGhaEng: parseNullableString(body.quesGhaEng),

    quesGhaLinkType: ghaLink.type,

    quesGhaLinkId: ghaLink.id,

    ansGhaBN: parseNullableJsonValue(body.ansGhaBN, "ansGhaBN"),

    ansGhaEng: parseNullableJsonValue(body.ansGhaEng, "ansGhaEng"),
  };

  /**

   \\* With exactOptionalPropertyTypes enabled,

   \\* only assign isActive when the client actually

   \\* supplied it.

   \\*

   \\* If omitted, the service uses false for a new CQ.

   */

  if (hasOwn(body, "isActive")) {
    data.isActive = parseBoolean(body.isActive, "isActive");
  }

  return data;
}

/**

 \\* Build a PARTIAL CQ update.

 \\*

 \\* Only fields actually supplied by the client

 \\* are included.

 \\*

 \\* This allows independent updates such as:

 \\* - serial only

 \\* - point only

 \\* - active/inactive only

 \\* - stimulus only

 \\* - Ka only

 \\* - Kha only

 \\* - Ga only

 \\* - Gha only

 \\* - answer only

 \\* - clearing nullable values

 */

function buildUpdateInput(body: Record<string, unknown>): UpdateCQInput {
  const data: UpdateCQInput = {};

  if (hasOwn(body, "questionPaperId")) {
    data.questionPaperId = parseUuid(body.questionPaperId, "questionPaperId");
  }

  if (hasOwn(body, "qusNo")) {
    data.qusNo = parseOptionalPositiveInt(body.qusNo, "qusNo");
  }

  if (hasOwn(body, "point")) {
    data.point = parseOptionalNonNegativeInt(body.point, "point");
  }

  /**

   \\* Each CQ controls its own active state.

   \\*

   \\* true  -> this CQ becomes active

   \\* false -> this CQ becomes inactive

   */

  if (hasOwn(body, "isActive")) {
    data.isActive = parseBoolean(body.isActive, "isActive");
  }

  if (hasOwn(body, "ytLink")) {
    data.ytLink = parseNullableString(body.ytLink);
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
    data.quesKaLinkId = parseOptionalUuid(body.quesKaLinkId, "quesKaLinkId");
  }

  if (hasOwn(body, "ansKaBN")) {
    const ansKaBN = parseOptionalJsonValue(body.ansKaBN, "ansKaBN");
    if (ansKaBN !== undefined) {
      data.ansKaBN = ansKaBN;
    }
  }

  if (hasOwn(body, "ansKaEng")) {
    const ansKaEng = parseOptionalJsonValue(body.ansKaEng, "ansKaEng");
    if (ansKaEng !== undefined) {
      data.ansKaEng = ansKaEng;
    }
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
    data.quesKhaLinkId = parseOptionalUuid(body.quesKhaLinkId, "quesKhaLinkId");
  }

  if (hasOwn(body, "ansKhaBN")) {
    const ansKhaBN = parseOptionalJsonValue(body.ansKhaBN, "ansKhaBN");
    if (ansKhaBN !== undefined) {
      data.ansKhaBN = ansKhaBN;
    }
  }

  if (hasOwn(body, "ansKhaEng")) {
    const ansKhaEng = parseOptionalJsonValue(body.ansKhaEng, "ansKhaEng");
    if (ansKhaEng !== undefined) {
      data.ansKhaEng = ansKhaEng;
    }
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
    data.quesGaLinkId = parseOptionalUuid(body.quesGaLinkId, "quesGaLinkId");
  }

  if (hasOwn(body, "ansGaBN")) {
    const ansGaBN = parseOptionalJsonValue(body.ansGaBN, "ansGaBN");
    if (ansGaBN !== undefined) {
      data.ansGaBN = ansGaBN;
    }
  }

  if (hasOwn(body, "ansGaEng")) {
    const ansGaEng = parseOptionalJsonValue(body.ansGaEng, "ansGaEng");
    if (ansGaEng !== undefined) {
      data.ansGaEng = ansGaEng;
    }
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
    data.quesGhaLinkId = parseOptionalUuid(body.quesGhaLinkId, "quesGhaLinkId");
  }

  if (hasOwn(body, "ansGhaBN")) {
    const ansGhaBN = parseOptionalJsonValue(body.ansGhaBN, "ansGhaBN");
    if (ansGhaBN !== undefined) {
      data.ansGhaBN = ansGhaBN;
    }
  }

  if (hasOwn(body, "ansGhaEng")) {
    const ansGhaEng = parseOptionalJsonValue(body.ansGhaEng, "ansGhaEng");
    if (ansGhaEng !== undefined) {
      data.ansGhaEng = ansGhaEng;
    }
  }

  return data;
}

function getRequestBody(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new Error("Request body must be an object");
  }

  return req.body as Record<string, unknown>;
}

/**

 \\* Convert one nested CQ question into the internal

 \\* CreateCQInput-compatible flat structure.

 \\*

 \\* External bulk JSON format:

 \\*

 \\* ka: {

 \\*   bn,

 \\*   eng,

 \\*   link: {

 \\*     id,

 \\*     type

 \\*   }

 \\* }

 \\*

 \\* Internal service format:

 \\*

 \\* quesKaBN

 \\* quesKaEng

 \\* quesKaLinkId

 \\* quesKaLinkType

 */

function normalizeBulkQuestion(
  question: Record<string, unknown>,

  index: number,
): Record<string, unknown> {
  const ka =
    question.ka &&
    typeof question.ka === "object" &&
    !Array.isArray(question.ka)
      ? (question.ka as Record<string, unknown>)
      : null;

  const kha =
    question.kha &&
    typeof question.kha === "object" &&
    !Array.isArray(question.kha)
      ? (question.kha as Record<string, unknown>)
      : null;

  const ga =
    question.ga &&
    typeof question.ga === "object" &&
    !Array.isArray(question.ga)
      ? (question.ga as Record<string, unknown>)
      : null;

  const gha =
    question.gha &&
    typeof question.gha === "object" &&
    !Array.isArray(question.gha)
      ? (question.gha as Record<string, unknown>)
      : null;

  if (!ka) {
    throw new Error(`questions[${index}].ka is required`);
  }

  if (!kha) {
    throw new Error(`questions[${index}].kha is required`);
  }

  if (!ga) {
    throw new Error(`questions[${index}].ga is required`);
  }

  const kaLink =
    ka.link && typeof ka.link === "object" && !Array.isArray(ka.link)
      ? (ka.link as Record<string, unknown>)
      : null;

  const khaLink =
    kha.link && typeof kha.link === "object" && !Array.isArray(kha.link)
      ? (kha.link as Record<string, unknown>)
      : null;

  const gaLink =
    ga.link && typeof ga.link === "object" && !Array.isArray(ga.link)
      ? (ga.link as Record<string, unknown>)
      : null;

  const ghaLink =
    gha && gha.link && typeof gha.link === "object" && !Array.isArray(gha.link)
      ? (gha.link as Record<string, unknown>)
      : null;

  const normalized: Record<string, unknown> = {
    questionPaperId: question.questionPaperId,

    qusNo: question.qusNo,

    point: question.point,

    isActive: question.isActive,

    descriptionBN: question.descriptionBN,

    descriptionEng: question.descriptionEng,

    quesUddipok: question.quesUddipok,

    imageUrl: question.imageUrl,

    ytLink: question.ytLink,

    // ক

    quesKaBN: ka.bn,

    quesKaEng: ka.eng,

    quesKaLinkType: kaLink?.type ?? null,

    quesKaLinkId: kaLink?.id ?? null,

    ansKaBN: ka.answerBN,

    ansKaEng: ka.answerEng,

    // খ

    quesKhaBN: kha.bn,

    quesKhaEng: kha.eng,

    quesKhaLinkType: khaLink?.type ?? null,

    quesKhaLinkId: khaLink?.id ?? null,

    ansKhaBN: kha.answerBN,

    ansKhaEng: kha.answerEng,

    // গ

    quesGaBN: ga.bn,

    quesGaEng: ga.eng,

    quesGaLinkType: gaLink?.type ?? null,

    quesGaLinkId: gaLink?.id ?? null,

    ansGaBN: ga.answerBN,

    ansGaEng: ga.answerEng,

    // ঘ — optional

    quesGhaBN: gha?.bn ?? null,

    quesGhaEng: gha?.eng ?? null,

    quesGhaLinkType: ghaLink?.type ?? null,

    quesGhaLinkId: ghaLink?.id ?? null,

    ansGhaBN: gha?.answerBN ?? null,

    ansGhaEng: gha?.answerEng ?? null,
  };

  return normalized;
}

/**

 \\* Build all CQ inputs for bulk creation.

 \\*

 \\* Bulk JSON uses the nested CQ format:

 \\*

 \\* {

 \\*   "questions": [

 \\*     {

 \\*       "questionPaperId": "...",

 \\*       "qusNo": 1,

 \\*       "descriptionBN": [],

 \\*       "descriptionEng": [],

 \\*       "imageUrl": null,

 \\*       "ka": {

 \\*         "bn": "...",

 \\*         "eng": "...",

 \\*         "link": {

 \\*           "id": "...",

 \\*           "type": "CHAPTER"

 \\*         },

 \\*         "answerBN": null,

 \\*         "answerEng": null

 \\*       },

 \\*       "kha": {},

 \\*       "ga": {},

 \\*       "gha": null

 \\*     }

 \\*   ]

 \\* }

 \\*

 \\* Each nested question is converted into the existing

 \\* internal CreateCQInput format and then passed through

 \\* the existing validation.

 */

function buildBulkCreateInputs(body: Record<string, unknown>): CreateCQInput[] {
  const questions = body.questions;

  if (!Array.isArray(questions)) {
    throw new Error("questions must be an array");
  }

  if (questions.length === 0) {
    throw new Error("questions must contain at least one CQ");
  }

  return questions.map((question, index) => {
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      throw new Error(`questions[${index}] must be an object`);
    }

    const normalizedQuestion = normalizeBulkQuestion(
      question as Record<string, unknown>,

      index,
    );

    return buildCreateInput(normalizedQuestion);
  });
}

function getSafeClientErrorMessage(error: unknown): string | null {
  const message = typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : null;

  if (!message) return null;

  if (/^[A-Za-z][A-Za-z0-9_.\[\]]{0,100} is required(?: and must contain valid JSON)?$/.test(message)) {
    return message;
  }

  if (/^[A-Za-z][A-Za-z0-9_.\[\]]{0,100} must be (?:a positive integer|a non-negative integer|a valid UUID|true or false|a boolean|a string|an object|a non-empty array|a non-empty string)$/.test(message)) {
    return message;
  }

  if (/^[A-Za-z][A-Za-z0-9_.\[\]]{0,100} must (?:contain valid JSON|not be empty)$/.test(message)) {
    return message;
  }

  const safeMessages: Record<string, string> = {
    "Request body must be an object": "Request body must be an object",
    "Question Paper not found": "Question paper not found",
    "CQ not found": "CQ not found",
    "Knowledge link type must be CHAPTER, LESSON, CONCEPT, or EXECUTION": "Knowledge link type must be CHAPTER, LESSON, CONCEPT, or EXECUTION",
    "At least one CQ is required": "At least one CQ is required",
    "questions must be an array": "questions must be an array",
    "questions must contain at least one CQ": "questions must contain at least one CQ",
    "At least one CQ update is required": "At least one CQ update is required",
    "Every CQ update must include a valid string ID": "Every CQ update must include a valid string ID",
    "quesGhaBN is required when Gha is provided": "quesGhaBN is required when Gha is provided",
    "quesGhaEng is required when Gha is provided": "quesGhaEng is required when Gha is provided",
    "quesGhaLinkId is required when Gha is provided": "quesGhaLinkId is required when Gha is provided",
    "Gha question must be provided before Gha answer or knowledge link": "Gha question must be provided before Gha answer or knowledge link",
  };

  if (safeMessages[message]) return safeMessages[message];
  if (message.startsWith("Invalid knowledge link type:")) return "Invalid knowledge link type";
  if (/^Question number \d+ already exists in this Question Paper$/.test(message)) {
    return "Question number already exists in this question paper";
  }
  if (/^(?:ques[A-Za-z]+ )?(?:chapter|lesson|concept|execution) with ID .+ (?:was not found|for .+ was not found|has no valid (?:chapter|lesson|concept))$/.test(message)) {
    return "Referenced content was not found";
  }
  if (/^(?:ques[A-Za-z]+ )?(?:chapter|lesson|concept|execution) with ID .+ does not belong to the Question Paper subject$/.test(message)) {
    return "Knowledge link does not belong to the question paper subject";
  }
  if (/^CQ ID .+ appears more than once in the bulk update$/.test(message)) return "Duplicate CQ id in bulk update";
  if (/^CQ with ID .+ was not found$/.test(message)) return "CQ not found";
  if (/^Update data is required for CQ .+$/.test(message)) return "Update data is required for each CQ";
  if (/^At least one field must be provided for CQ .+$/.test(message)) return "At least one field must be provided for each CQ";

  return null;
}

function handleControllerError(error: unknown, res: Response): void {
  const validationMessage = getSafeClientErrorMessage(error);
  if (validationMessage !== null) {
    res.status(400).json({ success: false, message: validationMessage });
    return;
  }

  console.error("Admin CQ controller failed", error instanceof Error ? "Error" : "NonErrorThrown");
  res.status(500).json({ data: "error response" });
}

function sanitizeBulkUpdateResults<T extends { success: boolean; error?: string }>(results: T[]): T[] {
  return results.map((result) => {
    if (result.success || result.error === undefined) return result;
    return {
      ...result,
      error: getSafeClientErrorMessage(result.error) ?? "Update failed",
    };
  });
}

export async function createCQController(req: Request, res: Response) {
  try {
    const body = getRequestBody(req);

    /**

     \\* Bulk creation:

     \\*

     \\* {

     \\*   "questions": [

     \\*     { ...nested CQ 1... },

     \\*     { ...nested CQ 2... }

     \\*   ]

     \\* }

     */

    if (Object.prototype.hasOwnProperty.call(body, "questions")) {
      const data = buildBulkCreateInputs(body);

      const cqs = await createCQs(data);

      res.status(201).json({
        success: true,

        data: cqs,
      });

      return;
    }

    /**

     \\* Existing single CQ creation remains unchanged.

     \\*

     \\* Single creation continues to use the existing

     \\* flat request structure expected by the admin UI.

     */

    const data = buildCreateInput(body);

    const cq = await createCQ(data);

    res.status(201).json({
      success: true,

      data: cq,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
}

export async function getCQsController(req: Request, res: Response) {
  try {
    const questionPaperId =
      req.query.questionPaperId !== undefined
        ? parseUuid(req.query.questionPaperId, "questionPaperId")
        : undefined;

    const cqs = await getCQs(questionPaperId);

    res.status(200).json({
      success: true,

      data: cqs,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
}

export async function getCQController(req: Request, res: Response) {
  try {
    const id = parseUuid(req.params.id, "id");

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
    handleControllerError(error, res);
  }
}

export async function updateCQController(req: Request, res: Response) {
  try {
    const id = parseUuid(req.params.id, "id");

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
    handleControllerError(error, res);
  }
}

/**
 * Bulk partial update.
 *
 * Request body:
 * {
 *   "updates": [
 *     { "id": "<CQ UUID>", "data": { "quesKaLinkType": "CONCEPT", "quesKaLinkId": "<UUID>" } },
 *     { "id": "<CQ UUID>", "data": { "quesGaLinkType": "LESSON", "quesGaLinkId": "<UUID>" } }
 *   ]
 * }
 *
 * Each item can update a different subset of fields. The existing
 * single-update validation and service logic are reused.
 */
export async function updateCQsController(req: Request, res: Response) {
  try {
    const body = getRequestBody(req);
    const updates = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("updates must be a non-empty array");
    }

    const prepared = updates.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`updates[${index}] must be an object`);
      }

      const record = item as Record<string, unknown>;
      const id = parseUuid(record.id, `updates[${index}].id`);

      // Accept both { id, data: { ... } } and { id, ...fields }.
      const rawData =
        record.data &&
        typeof record.data === "object" &&
        !Array.isArray(record.data)
          ? (record.data as Record<string, unknown>)
          : Object.fromEntries(
              Object.entries(record).filter(([key]) => key !== "id"),
            );

      const data = buildUpdateInput(rawData);

      if (Object.keys(data).length === 0) {
        throw new Error(
          `updates[${index}] must contain at least one field to update`,
        );
      }

      return { id, data };
    });

    const results = sanitizeBulkUpdateResults(await updateCQs(prepared));
    const succeeded = results.filter((result) => result.success).length;
    const failed = results.length - succeeded;

    res.status(failed === 0 ? 200 : 207).json({
      success: failed === 0,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
      data: results,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
}

export async function deleteCQController(req: Request, res: Response) {
  try {
    const id = parseUuid(req.params.id, "id");

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
    handleControllerError(error, res);
  }
}

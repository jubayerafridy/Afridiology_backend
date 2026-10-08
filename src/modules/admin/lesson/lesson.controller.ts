import type { Request, Response } from "express";

import {
  createLesson,
  deleteLesson,
  getLesson,
  getLessons,
  updateLesson,
} from "./lesson.service.js";

import type {
  CreateLessonInput,
  LessonDocument,
  UpdateLessonInput,
} from "./lesson.service.js";

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

function parseUuid(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a valid UUID`);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

/**
 * ================================================================
 * LESSON NUMBER HELPERS
 * ================================================================
 */

function normalizeLessonNumber(value: string): string {
  return value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .trim();
}

function isValidLessonNumber(value: string): boolean {
  return /^\d+(?:\.\d+)+$/.test(value);
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
 * LESSON DOCUMENT VALIDATION
 * ================================================================
 */

function parseLessonDocument(value: unknown): LessonDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const document: LessonDocument = [];

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

    document.push(candidate as LessonDocument[number]);
  }

  return document;
}

/**
 * ================================================================
 * CREATE LESSON
 * ================================================================
 */

export async function createLessonController(
  req: Request,
  res: Response,
): Promise<void> {
  const {
    chapterId,
    lessonNo,
    nameBN,
    nameEng,
    descriptionBN,
    descriptionEng,
  } = req.body as {
    chapterId?: unknown;
    lessonNo?: unknown;
    nameBN?: unknown;
    nameEng?: unknown;
    descriptionBN?: unknown;
    descriptionEng?: unknown;
  };

  const parsedChapterId = parseUuid(chapterId, "chapterId");

  if (parsedChapterId === null) {
    res.status(400).json({
      success: false,
      message: "Valid chapterId is required",
    });

    return;
  }

  let normalizedLessonNo: string | null = null;

  if (lessonNo !== undefined && lessonNo !== null) {
    if (typeof lessonNo !== "string") {
      res.status(400).json({
        success: false,
        message: "Lesson number must be a string or omitted",
      });

      return;
    }

    const normalized = normalizeLessonNumber(lessonNo);

    if (normalized.length > 0) {
      if (!isValidLessonNumber(normalized)) {
        res.status(400).json({
          success: false,
          message: "Valid lesson number is required, for example 3.1 or 3.2.1",
        });

        return;
      }

      normalizedLessonNo = normalized;
    }
  }

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson name is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English lesson name is required",
    });

    return;
  }

  const parsedDescriptionBN = parseJsonValue(descriptionBN);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla lesson description is required",
    });

    return;
  }

  const lessonDocumentBN = parseLessonDocument(parsedDescriptionBN);

  if (lessonDocumentBN === null) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson description must be an ordered document array",
    });

    return;
  }

  const parsedDescriptionEng = parseJsonValue(descriptionEng);

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English lesson description is required",
    });

    return;
  }

  const lessonDocumentEng = parseLessonDocument(parsedDescriptionEng);

  if (lessonDocumentEng === null) {
    res.status(400).json({
      success: false,
      message: "English lesson description must be an ordered document array",
    });

    return;
  }

  try {
    const lessonInput: CreateLessonInput = {
      chapterId: parsedChapterId,
      lessonNo: normalizedLessonNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: lessonDocumentBN,
      descriptionEng: lessonDocumentEng,
    };

    const lesson = await createLesson(lessonInput);

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: lesson,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Chapter not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "A lesson with this serial number already exists for this chapter"
    ) {
      res.status(409).json({
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
 * GET LESSONS
 * ================================================================
 */

export async function getLessonsController(
  req: Request,
  res: Response,
): Promise<void> {
  const chapterIdValue = req.query.chapterId;

  let chapterId: string | undefined;

  if (chapterIdValue !== undefined) {
    const parsedChapterId = parseUuid(chapterIdValue, "chapterId");

    if (parsedChapterId === null) {
      res.status(400).json({
        success: false,
        message: "Invalid chapterId",
      });

      return;
    }

    chapterId = parsedChapterId;
  }

  const lessons = await getLessons(chapterId);

  res.status(200).json({
    success: true,
    data: lessons,
  });
}

/**
 * ================================================================
 * GET SINGLE LESSON
 * ================================================================
 */

export async function getLessonController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id, "id");

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid lesson ID",
    });

    return;
  }

  const lesson = await getLesson(id);

  if (!lesson) {
    res.status(404).json({
      success: false,
      message: "Lesson not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: lesson,
  });
}

/**
 * ================================================================
 * UPDATE LESSON
 * ================================================================
 */

export async function updateLessonController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id, "id");

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid lesson ID",
    });

    return;
  }

  const { lessonNo, nameBN, nameEng, descriptionBN, descriptionEng } =
    req.body as {
      lessonNo?: unknown;
      nameBN?: unknown;
      nameEng?: unknown;
      descriptionBN?: unknown;
      descriptionEng?: unknown;
    };

  let normalizedLessonNo: string | null = null;

  if (lessonNo !== undefined && lessonNo !== null) {
    if (typeof lessonNo !== "string") {
      res.status(400).json({
        success: false,
        message: "Lesson number must be a string or omitted",
      });

      return;
    }

    const normalized = normalizeLessonNumber(lessonNo);

    if (normalized.length > 0) {
      if (!isValidLessonNumber(normalized)) {
        res.status(400).json({
          success: false,
          message: "Valid lesson number is required, for example 3.1 or 3.2.1",
        });

        return;
      }

      normalizedLessonNo = normalized;
    }
  }

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson name is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English lesson name is required",
    });

    return;
  }

  const parsedDescriptionBN = parseJsonValue(descriptionBN);

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla lesson description is required",
    });

    return;
  }

  const lessonDocumentBN = parseLessonDocument(parsedDescriptionBN);

  if (lessonDocumentBN === null) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson description must be an ordered document array",
    });

    return;
  }

  const parsedDescriptionEng = parseJsonValue(descriptionEng);

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English lesson description is required",
    });

    return;
  }

  const lessonDocumentEng = parseLessonDocument(parsedDescriptionEng);

  if (lessonDocumentEng === null) {
    res.status(400).json({
      success: false,
      message: "English lesson description must be an ordered document array",
    });

    return;
  }

  try {
    const lessonInput: UpdateLessonInput = {
      lessonNo: normalizedLessonNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: lessonDocumentBN,
      descriptionEng: lessonDocumentEng,
    };

    const lesson = await updateLesson(id, lessonInput);

    if (!lesson) {
      res.status(404).json({
        success: false,
        message: "Lesson not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: lesson,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "A lesson with this serial number already exists for this chapter"
    ) {
      res.status(409).json({
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
 * DELETE LESSON
 * ================================================================
 */

export async function deleteLessonController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id, "id");

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid lesson ID",
    });

    return;
  }

  const deletedLesson = await deleteLesson(id);

  if (!deletedLesson) {
    res.status(404).json({
      success: false,
      message: "Lesson not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Lesson deleted successfully",
    data: deletedLesson,
  });
}

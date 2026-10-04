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
 * LESSON NUMBER HELPERS
 * ================================================================
 */

/**
 * Converts Bangla digits to English digits and removes
 * surrounding whitespace.
 *
 * Example:
 *
 * "৩.১" -> "3.1"
 * " 3.2.1 " -> "3.2.1"
 */
function normalizeLessonNumber(value: string): string {
  return value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .trim();
}

/**
 * Lesson numbers support hierarchical serials such as:
 *
 * 3.1
 * 3.2
 * 3.2.1
 * 10.4.2
 */
function isValidLessonNumber(value: string): boolean {
  return /^\d+(?:\.\d+)+$/.test(value);
}

/**
 * ================================================================
 * JSON VALIDATION
 * ================================================================
 */

/**
 * Checks whether a value can safely be stored as JSON.
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

/**
 * Parses a request-body JSON value.
 *
 * Returns null when the supplied value is not valid JSON.
 */
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
 *
 * Lesson.descriptionBN and Lesson.descriptionEng are ordered
 * JSON documents.
 *
 * Example:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "..."
 *   },
 *   {
 *     "type": "concept",
 *     "conceptID": 101
 *   },
 *   {
 *     "type": "heading",
 *     "content": "..."
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - No block id exists.
 * - Array position determines order.
 * - type is required.
 * - Every other property must be valid JSON.
 *
 * The actual Concept row is identified by conceptID.
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

    /*
     * Every document item must have a type.
     */

    if (
      typeof candidate.type !== "string" ||
      candidate.type.trim().length === 0
    ) {
      return null;
    }

    /*
     * Validate all remaining properties.
     *
     * There is intentionally NO special "id" requirement.
     */

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
 *
 * POST /admin/lessons
 *
 * The controller validates the request.
 *
 * The service is responsible for:
 *
 * 1. Creating the Lesson entity.
 * 2. Obtaining the generated Lesson ID.
 * 3. Adding the Lesson reference to the parent Chapter
 *    description documents.
 *
 * Lesson content itself is stored in:
 *
 * descriptionBN
 * descriptionEng
 *
 * No structure field is used.
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

  /*
   * --------------------------------------------------
   * Validate chapterId
   * --------------------------------------------------
   */

  const parsedChapterId = Number(chapterId);

  if (!Number.isInteger(parsedChapterId) || parsedChapterId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid chapterId is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate lessonNo
   * --------------------------------------------------
   */

  if (typeof lessonNo !== "string") {
    res.status(400).json({
      success: false,
      message: "Lesson number is required",
    });

    return;
  }

  const normalizedLessonNo = normalizeLessonNumber(lessonNo);

  if (!isValidLessonNumber(normalizedLessonNo)) {
    res.status(400).json({
      success: false,
      message: "Valid lesson number is required, for example 3.1 or 3.2.1",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla name
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English name
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English lesson name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla document
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * Validate English document
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * Create Lesson
   * --------------------------------------------------
   */

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
    /*
     * --------------------------------------------------
     * Chapter not found
     * --------------------------------------------------
     */

    if (error instanceof Error && error.message === "Chapter not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Duplicate lesson number
     * --------------------------------------------------
     */

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
 *
 * Optional:
 *
 * GET /admin/lessons?chapterId=123
 *
 * Without chapterId:
 *
 * GET /admin/lessons
 *
 * CRUD listing may be ID ordered.
 *
 * Document/hierarchy ordering is NOT determined by this
 * database ordering.
 *
 * The Chapter description arrays determine where each Lesson
 * appears inside the Chapter document.
 */
export async function getLessonsController(
  req: Request,
  res: Response,
): Promise<void> {
  const chapterIdValue = req.query.chapterId;

  let chapterId: number | undefined;

  if (chapterIdValue !== undefined) {
    chapterId = Number(chapterIdValue);

    if (!Number.isInteger(chapterId) || chapterId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid chapterId",
      });

      return;
    }
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
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
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
 *
 * PUT /admin/lessons/:id
 *
 * Updating Lesson metadata does not change the Lesson reference
 * inside the parent Chapter.
 *
 * The Lesson database ID remains unchanged.
 *
 * The Lesson's own ordered documents can be replaced by sending:
 *
 * descriptionBN
 * descriptionEng
 *
 * No structure field is accepted.
 */
export async function updateLessonController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
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

  /*
   * --------------------------------------------------
   * Validate lessonNo
   * --------------------------------------------------
   */

  if (typeof lessonNo !== "string") {
    res.status(400).json({
      success: false,
      message: "Lesson number is required",
    });

    return;
  }

  const normalizedLessonNo = normalizeLessonNumber(lessonNo);

  if (!isValidLessonNumber(normalizedLessonNo)) {
    res.status(400).json({
      success: false,
      message: "Valid lesson number is required, for example 3.1 or 3.2.1",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla name
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English name
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English lesson name is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla document
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * Validate English document
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * Update Lesson
   * --------------------------------------------------
   */

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
    /*
     * --------------------------------------------------
     * Duplicate lesson number
     * --------------------------------------------------
     */

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
 *
 * The service:
 *
 * 1. Finds the Lesson.
 * 2. Removes its reference from the parent Chapter's
 *    descriptionBN and descriptionEng.
 * 3. Deletes the Lesson entity.
 *
 * CQ / MCQ records are intentionally not deleted.
 */
export async function deleteLessonController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
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

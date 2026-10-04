import type { Request, Response } from "express";

import {
  createChapter,
  deleteChapter,
  getChapters,
  updateChapter,
} from "./chapter.service.js";

import type {
  CreateChapterInput,
  UpdateChapterInput,
} from "./chapter.service.js";

/*
 * ================================================================
 * JSON TYPES
 * ================================================================
 */

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/*
 * ================================================================
 * HELPERS
 * ================================================================
 */

function parsePositiveInteger(value: unknown): number | null {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
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

function parseJsonValue(value: unknown, _fieldName: string): JsonValue | null {
  if (!isJsonValue(value)) {
    return null;
  }

  return value;
}

/*
 * ================================================================
 * CHAPTER DOCUMENT VALIDATION
 * ================================================================
 *
 * Chapter.descriptionBN and Chapter.descriptionEng are the
 * complete ordered Chapter documents.
 *
 * Example:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "..."
 *   },
 *   {
 *     "type": "lesson",
 *     "lessonID": 45
 *   },
 *   {
 *     "type": "heading",
 *     "content": "..."
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - Content blocks do NOT have IDs.
 * - Array order is the source of truth.
 * - type is required.
 * - Every other property must be valid JSON.
 * - lessonID identifies the actual Lesson table row.
 *
 * There is no:
 *
 * - structure
 * - flow
 * - artificial block id
 */

type ChapterDocumentItem = {
  type: string;
  [key: string]: JsonValue;
};

type ChapterDocument = ChapterDocumentItem[];

function parseChapterDocument(value: unknown): ChapterDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const document: ChapterDocument = [];

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
     * Validate every property other than type
     * as JSON.
     */

    for (const [key, propertyValue] of Object.entries(candidate)) {
      if (key === "type") {
        continue;
      }

      if (!isJsonValue(propertyValue)) {
        return null;
      }
    }

    document.push(candidate as ChapterDocumentItem);
  }

  return document;
}

/*
 * ================================================================
 * CREATE CHAPTER
 * ================================================================
 *
 * POST /admin/chapters
 *
 * The controller validates the request.
 *
 * The service creates the Chapter entity with:
 *
 * descriptionBN
 * descriptionEng
 *
 * A newly created Chapter does not need a separate structure
 * field.
 *
 * Lesson references are added later by lesson.service.ts:
 *
 * {
 *   "type": "lesson",
 *   "lessonID": LESSON_ID
 * }
 */

export async function createChapterController(
  req: Request,
  res: Response,
): Promise<void> {
  const {
    subjectId,
    chapterNo,
    nameBN,
    nameEng,
    descriptionBN,
    descriptionEng,
  } = req.body as {
    subjectId?: unknown;
    chapterNo?: unknown;
    nameBN?: unknown;
    nameEng?: unknown;
    descriptionBN?: unknown;
    descriptionEng?: unknown;
  };

  /*
   * --------------------------------------------------
   * Validate subjectId
   * --------------------------------------------------
   */

  const parsedSubjectId = parsePositiveInteger(subjectId);

  if (parsedSubjectId === null) {
    res.status(400).json({
      success: false,
      message: "Valid subjectId is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate chapterNo
   * --------------------------------------------------
   */

  const parsedChapterNo = parsePositiveInteger(chapterNo);

  if (parsedChapterNo === null) {
    res.status(400).json({
      success: false,
      message: "Valid chapter number is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla chapter title
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla chapter title is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English chapter title
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English chapter title is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla description document
   * --------------------------------------------------
   */

  const parsedDescriptionBN = parseJsonValue(descriptionBN, "descriptionBN");

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla chapter description is required",
    });

    return;
  }

  const chapterDocumentBN = parseChapterDocument(parsedDescriptionBN);

  if (chapterDocumentBN === null) {
    res.status(400).json({
      success: false,
      message: "Bangla chapter description must be an ordered document array",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English description document
   * --------------------------------------------------
   */

  const parsedDescriptionEng = parseJsonValue(descriptionEng, "descriptionEng");

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English chapter description is required",
    });

    return;
  }

  const chapterDocumentEng = parseChapterDocument(parsedDescriptionEng);

  if (chapterDocumentEng === null) {
    res.status(400).json({
      success: false,
      message: "English chapter description must be an ordered document array",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Create Chapter
   * --------------------------------------------------
   */

  try {
    const chapterInput: CreateChapterInput = {
      subjectId: parsedSubjectId,
      chapterNo: parsedChapterNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: chapterDocumentBN,
      descriptionEng: chapterDocumentEng,
    };

    const chapter = await createChapter(chapterInput);

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: chapter,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    /*
     * --------------------------------------------------
     * Subject not found
     * --------------------------------------------------
     */

    if (error.message === "Subject not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Duplicate chapter number
     * --------------------------------------------------
     */

    if (
      error.message ===
      "A chapter with this serial number already exists for this subject"
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

/*
 * ================================================================
 * GET CHAPTERS
 * ================================================================
 *
 * GET /admin/chapters?subjectId=123
 *
 * Returns Chapters belonging to the specified Subject.
 */

export async function getChaptersController(
  req: Request,
  res: Response,
): Promise<void> {
  const subjectId = parsePositiveInteger(req.query.subjectId);

  if (subjectId === null) {
    res.status(400).json({
      success: false,
      message: "Valid subjectId is required",
    });

    return;
  }

  const chapters = await getChapters(subjectId);

  res.status(200).json({
    success: true,
    data: chapters,
  });
}

/*
 * ================================================================
 * UPDATE CHAPTER
 * ================================================================
 *
 * PUT /admin/chapters/:id
 *
 * The complete Chapter document is supplied through:
 *
 * descriptionBN
 * descriptionEng
 *
 * Array order determines document order.
 *
 * There is no separate structure field.
 *
 * Existing Lesson references must therefore remain in the
 * supplied document whenever the frontend wants to preserve them.
 */

export async function updateChapterController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInteger(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid chapter ID",
    });

    return;
  }

  const { chapterNo, nameBN, nameEng, descriptionBN, descriptionEng } =
    req.body as {
      chapterNo?: unknown;
      nameBN?: unknown;
      nameEng?: unknown;
      descriptionBN?: unknown;
      descriptionEng?: unknown;
    };

  /*
   * --------------------------------------------------
   * Validate chapterNo
   * --------------------------------------------------
   */

  const parsedChapterNo = parsePositiveInteger(chapterNo);

  if (parsedChapterNo === null) {
    res.status(400).json({
      success: false,
      message: "Valid chapter number is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla chapter title
   * --------------------------------------------------
   */

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla chapter title is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English chapter title
   * --------------------------------------------------
   */

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English chapter title is required",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate Bangla description document
   * --------------------------------------------------
   */

  const parsedDescriptionBN = parseJsonValue(descriptionBN, "descriptionBN");

  if (parsedDescriptionBN === null) {
    res.status(400).json({
      success: false,
      message: "Valid Bangla chapter description is required",
    });

    return;
  }

  const chapterDocumentBN = parseChapterDocument(parsedDescriptionBN);

  if (chapterDocumentBN === null) {
    res.status(400).json({
      success: false,
      message: "Bangla chapter description must be an ordered document array",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Validate English description document
   * --------------------------------------------------
   */

  const parsedDescriptionEng = parseJsonValue(descriptionEng, "descriptionEng");

  if (parsedDescriptionEng === null) {
    res.status(400).json({
      success: false,
      message: "Valid English chapter description is required",
    });

    return;
  }

  const chapterDocumentEng = parseChapterDocument(parsedDescriptionEng);

  if (chapterDocumentEng === null) {
    res.status(400).json({
      success: false,
      message: "English chapter description must be an ordered document array",
    });

    return;
  }

  /*
   * --------------------------------------------------
   * Update Chapter
   * --------------------------------------------------
   */

  try {
    const chapterInput: UpdateChapterInput = {
      chapterNo: parsedChapterNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: chapterDocumentBN,
      descriptionEng: chapterDocumentEng,
    };

    const chapter = await updateChapter(id, chapterInput);

    if (!chapter) {
      res.status(404).json({
        success: false,
        message: "Chapter not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Chapter updated successfully",
      data: chapter,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "A chapter with this serial number already exists for this subject"
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

/*
 * ================================================================
 * DELETE CHAPTER
 * ================================================================
 *
 * DELETE /admin/chapters/:id
 *
 * The service handles deletion of the Chapter entity.
 *
 * Connected CQ / MCQ records are not treated as hierarchy
 * children by this controller.
 */

export async function deleteChapterController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parsePositiveInteger(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid chapter ID",
    });

    return;
  }

  const deletedChapter = await deleteChapter(id);

  if (!deletedChapter) {
    res.status(404).json({
      success: false,
      message: "Chapter not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Chapter deleted successfully",
    data: deletedChapter,
  });
}

import type { Request, Response } from "express";

import {
  createLesson,
  deleteLesson,
  getLesson,
  getLessons,
  updateLesson,
} from "./lesson.service.js";

function normalizeLessonNumber(value: string): string {
  return value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .trim();
}

function isValidLessonNumber(value: string): boolean {
  return /^\d+(?:\.\d+)+$/.test(value);
}

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

  const parsedChapterId = Number(chapterId);

  if (!Number.isInteger(parsedChapterId) || parsedChapterId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid chapterId is required",
    });

    return;
  }

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

  if (typeof descriptionBN !== "string" || descriptionBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson description is required",
    });

    return;
  }

  if (
    typeof descriptionEng !== "string" ||
    descriptionEng.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      message: "English lesson description is required",
    });

    return;
  }

  try {
    const lesson = await createLesson({
      chapterId: parsedChapterId,
      lessonNo: normalizedLessonNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: descriptionBN.trim(),
      descriptionEng: descriptionEng.trim(),
    });

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

  if (typeof descriptionBN !== "string" || descriptionBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla lesson description is required",
    });

    return;
  }

  if (
    typeof descriptionEng !== "string" ||
    descriptionEng.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      message: "English lesson description is required",
    });

    return;
  }

  try {
    const lesson = await updateLesson(id, {
      lessonNo: normalizedLessonNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: descriptionBN.trim(),
      descriptionEng: descriptionEng.trim(),
    });

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

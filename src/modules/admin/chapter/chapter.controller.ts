import type { Request, Response } from "express";

import {
  createChapter,
  deleteChapter,
  getChapters,
  updateChapter,
} from "./chapter.service.js";

function parsePositiveInteger(value: unknown): number | null {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

export async function createChapterController(
  req: Request,
  res: Response,
): Promise<void> {
  const { subjectId, chapterNo, nameBN, nameEng } = req.body as {
    subjectId?: unknown;
    chapterNo?: unknown;
    nameBN?: unknown;
    nameEng?: unknown;
  };

  const parsedSubjectId = parsePositiveInteger(subjectId);

  const parsedChapterNo = parsePositiveInteger(chapterNo);

  if (parsedSubjectId === null) {
    res.status(400).json({
      success: false,
      message: "Valid subjectId is required",
    });

    return;
  }

  if (parsedChapterNo === null) {
    res.status(400).json({
      success: false,
      message: "Valid chapter number is required",
    });

    return;
  }

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla chapter title is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English chapter title is required",
    });

    return;
  }

  try {
    const chapter = await createChapter({
      subjectId: parsedSubjectId,
      chapterNo: parsedChapterNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: chapter,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "Subject not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

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

  const { chapterNo, nameBN, nameEng } = req.body as {
    chapterNo?: unknown;
    nameBN?: unknown;
    nameEng?: unknown;
  };

  const parsedChapterNo = parsePositiveInteger(chapterNo);

  if (parsedChapterNo === null) {
    res.status(400).json({
      success: false,
      message: "Valid chapter number is required",
    });

    return;
  }

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla chapter title is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English chapter title is required",
    });

    return;
  }

  try {
    const chapter = await updateChapter(id, {
      chapterNo: parsedChapterNo,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
    });

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

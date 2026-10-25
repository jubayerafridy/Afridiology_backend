import type { Request, Response } from "express";

import { getChapterMCQs, type ChapterMCQLanguage } from "./chapterMCQ.service.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

function parseParam(value: string | string[] | undefined): string | null {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (typeof normalizedValue !== "string") {
    return null;
  }

  const trimmed = normalizedValue.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isChapterMCQLanguage(value: string): value is ChapterMCQLanguage {
  return value === "bangla" || value === "english";
}

function getOptionalAuthenticatedUserId(req: Request): string | undefined {
  const auth = (req as AuthenticatedRequest).auth;

  if (!auth || typeof auth.userId !== "string" || auth.userId.trim().length === 0) {
    return undefined;
  }

  return auth.userId;
}

export async function getChapterMCQsController(req: Request, res: Response): Promise<void> {
  try {
    const chapterId = parseParam(req.params.chapterId);

    const rawLanguage = req.query.language;

    const languageValue = typeof rawLanguage === "string" ? rawLanguage.trim() : "bangla";

    if (chapterId === null) {
      res.status(400).json({
        success: false,
        message: "A valid chapterId is required",
      });
      return;
    }

    if (!isChapterMCQLanguage(languageValue)) {
      res.status(400).json({
        success: false,
        message: "language must be bangla or english",
      });
      return;
    }

    const userId = getOptionalAuthenticatedUserId(req);

    const data = await getChapterMCQs(chapterId, languageValue, userId);

    if (data === null) {
      res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Failed to fetch chapter MCQs:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch chapter MCQs",
    });
  }
}

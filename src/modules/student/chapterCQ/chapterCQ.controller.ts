import type { Request, Response } from "express";
import { getChapterCQs, type ChapterCQLanguage } from "./chapterCQ.service.js";
import { isUuid } from "../student.validation.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

function parseParam(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" && !Array.isArray(value)) {
    return null;
  }

  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (typeof normalizedValue !== "string") {
    return null;
  }

  const trimmed = normalizedValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isChapterCQLanguage(value: string): value is ChapterCQLanguage {
  return value === "bangla" || value === "english";
}

function getOptionalAuthenticatedUserId(req: Request): string | undefined {
  const auth = (req as AuthenticatedRequest).auth;

  if (!auth || typeof auth.userId !== "string" || auth.userId.trim().length === 0) {
    return undefined;
  }

  return auth.userId;
}

export async function getChapterCQsController(req: Request, res: Response): Promise<void> {
  try {
    const chapterId = parseParam(req.params.chapterId);

    // Express query parameters can be strings, arrays, or ParsedQs objects.
    // Accept only a string for the language parameter.
    const rawLanguage = req.query.language;
    const languageValue = rawLanguage === undefined
      ? "bangla"
      : typeof rawLanguage === "string" ? rawLanguage.trim() : "";

    if (chapterId === null || !isUuid(chapterId)) {
      res.status(400).json("invalid request");
      return;
    }

    if (!isChapterCQLanguage(languageValue)) {
      res.status(400).json("invalid request");
      return;
    }

    const userId = getOptionalAuthenticatedUserId(req);

    const data = await getChapterCQs(chapterId, languageValue, userId);

    if (data === null) {
      res.status(404).json("data not found");
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch chapter CQs:", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

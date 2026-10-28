import type { Request, Response } from "express";
import { getChaptersBySubject, type ChapterLanguage } from "./chapter.service.js";
import { isUuid } from "../student.validation.js";

function getQueryParam(value: Request["query"]["subjectId"]): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function parseUuid(value: Request["query"]["subjectId"]): string | null {
  const param = getQueryParam(value);

  if (param === null) {
    return null;
  }

  const trimmed = param.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return isUuid(trimmed) ? trimmed : null;
}

export async function getChaptersController(req: Request, res: Response): Promise<void> {
  const subjectId = parseUuid(req.query.subjectId);
  const rawLanguage = req.query.language;
  const language = rawLanguage === undefined
    ? "bangla"
    : typeof rawLanguage === "string" ? rawLanguage.trim() : "";

  if (subjectId === null) {
    res.status(400).json("invalid request");

    return;
  }

  if (language !== "bangla" && language !== "english") {
    res.status(400).json("invalid request");
    return;
  }

  try {
    const data = await getChaptersBySubject(subjectId, language as ChapterLanguage);

    res.status(200).json(data);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json("data not found");

      return;
    }

    throw error;
  }
}

import type { Request, Response } from "express";
import { getChaptersBySubject } from "./chapter.service.js";

function getQueryParam(value: Request["query"]["subjectId"]): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function parsePositiveInt(value: Request["query"]["subjectId"]): number | null {
  const param = getQueryParam(value);

  if (param === null) {
    return null;
  }

  const parsed = Number(param);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function getChaptersController(
  req: Request,
  res: Response,
): Promise<void> {
  const subjectId = parsePositiveInt(req.query.subjectId);

  if (subjectId === null) {
    res.status(400).json({
      success: false,
      message: "A valid subjectId is required",
    });

    return;
  }

  try {
    const data = await getChaptersBySubject(subjectId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Subject not found",
      });

      return;
    }

    throw error;
  }
}

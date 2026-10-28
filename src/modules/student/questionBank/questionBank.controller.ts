import type { Request, Response } from "express";
import { isUuid } from "../student.validation.js";

import { getBoardPapers, getPaperCQs, getPaperMCQs, getTestPapers } from "./questionBank.service.js";

/* =========================================================
 * HELPERS
 * ========================================================= */

function parseId(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !isUuid(value.trim())) {
    const error = new Error(`${fieldName} must be a valid UUID`);
    error.name = "BAD_REQUEST";
    throw error;
  }

  return value.trim();
}

function getQueryString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error(`${fieldName} is required`);
    error.name = "BAD_REQUEST";
    throw error;
  }

  return value;
}

type RequestLanguage = "english" | "bangla";

function getRequestLanguage(value: unknown): RequestLanguage | undefined {
  // Preserve the service's default behavior when language is omitted.
  if (value === undefined) {
    return undefined;
  }

  if (value === "english" || value === "bangla") {
    return value;
  }

  const error = new Error("Language must be either english or bangla");
  error.name = "BAD_REQUEST";
  throw error;
}

/* =========================================================
 * BOARD PAPERS
 * ========================================================= */

/**
 * Returns all active board papers for a subject.
 *
 * The listing uses subjectId and optionally validates language.
 * It does not require or filter by question type.
 */
export async function boardPapersController(req: Request, res: Response) {
  try {
    const subjectId = parseId(req.query.subjectId, "subjectId");

    // Validate language if supplied. The paper listing contains
    // metadata and does not need language-specific question content.
    getRequestLanguage(req.query.language);

    const data = await getBoardPapers(subjectId);

    res.status(200).json(data);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json("invalid request");
      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json("data not found");
      return;
    }

    console.error("Student question bank request failed", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

/* =========================================================
 * TEST PAPERS
 * ========================================================= */

export async function testPapersController(req: Request, res: Response) {
  try {
    const subjectId = parseId(req.query.subjectId, "subjectId");
    const type = getQueryString(req.query.type, "type");

    const data = await getTestPapers(subjectId, type);

    res.status(200).json(data);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json("invalid request");
      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json("data not found");
      return;
    }

    console.error("Student question bank request failed", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

/* =========================================================
 * PAPER CQs
 * ========================================================= */

export async function paperCQsController(req: Request, res: Response) {
  try {
    const paperId = parseId(req.params.paperId, "paperId");
    const language = getRequestLanguage(req.query.language);

    const data = await getPaperCQs(paperId, language);

    res.status(200).json(data);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json("invalid request");
      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json("data not found");
      return;
    }

    console.error("Student question bank request failed", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

/* =========================================================
 * PAPER MCQs
 * ========================================================= */

export async function paperMCQsController(req: Request, res: Response) {
  try {
    const paperId = parseId(req.params.paperId, "paperId");
    const language = getRequestLanguage(req.query.language);

    const data = await getPaperMCQs(paperId, language);

    res.status(200).json(data);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json("invalid request");
      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json("data not found");
      return;
    }

    console.error("Student question bank request failed", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

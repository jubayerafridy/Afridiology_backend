import type { Request, Response } from "express";

import {
  getBoardPapers,
  getPaperCQs,
  getPaperMCQs,
  getTestPapers,
} from "./questionBank.service.js";

/* =========================================================
 * HELPERS
 * ========================================================= */

function parseId(value: unknown, fieldName: string): number {
  if (typeof value !== "string") {
    const error = new Error(`${fieldName} must be a positive integer`);

    error.name = "BAD_REQUEST";

    throw error;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${fieldName} must be a positive integer`);

    error.name = "BAD_REQUEST";

    throw error;
  }

  return id;
}

function getQueryString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    const error = new Error(`${fieldName} is required`);

    error.name = "BAD_REQUEST";

    throw error;
  }

  return value;
}

/* =========================================================
 * BOARD PAPERS
 * ========================================================= */

export async function boardPapersController(req: Request, res: Response) {
  try {
    const subjectId = parseId(req.query.subjectId, "subjectId");

    const type = getQueryString(req.query.type, "type");

    const data = await getBoardPapers(subjectId, type);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =========================================================
 * PAPER CQs
 * ========================================================= */

export async function paperCQsController(req: Request, res: Response) {
  try {
    const paperId = parseId(req.params.paperId, "paperId");

    const data = await getPaperCQs(paperId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/* =========================================================
 * PAPER MCQs
 * ========================================================= */

export async function paperMCQsController(req: Request, res: Response) {
  try {
    const paperId = parseId(req.params.paperId, "paperId");

    const data = await getPaperMCQs(paperId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "BAD_REQUEST") {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    if (error instanceof Error && error.name === "NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

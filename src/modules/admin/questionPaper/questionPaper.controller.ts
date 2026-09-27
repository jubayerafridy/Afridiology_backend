import type { Request, Response } from "express";

import {
  createQuestionPaper,
  deleteQuestionPaper,
  getQuestionPaper,
  getQuestionPapers,
  updateQuestionPaper,
} from "./questionPaper.service.js";

const QUESTION_TYPES = ["CQ", "MCQ"] as const;

const QUESTION_SOURCES = [
  "BOARD",
  "TEST_PAPER",
  "MODEL_TEST",
  "GAME",
  "QUIZ",
  "EXTRA",
] as const;

function isQuestionType(
  value: unknown,
): value is (typeof QUESTION_TYPES)[number] {
  return (
    typeof value === "string" &&
    QUESTION_TYPES.includes(value as (typeof QUESTION_TYPES)[number])
  );
}

function isQuestionSource(
  value: unknown,
): value is (typeof QUESTION_SOURCES)[number] {
  return (
    typeof value === "string" &&
    QUESTION_SOURCES.includes(value as (typeof QUESTION_SOURCES)[number])
  );
}

function parseYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const year = Number(value);

  if (!Number.isInteger(year)) {
    return undefined;
  }

  return year;
}

function getValidationMessage(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const messages = [
    "Board is required for BOARD source",
    "Institution is not allowed for BOARD source",
    "Year is required for BOARD source",
    "Institution is required for TEST_PAPER source",
    "Board is not allowed for TEST_PAPER source",
    "Year is required for TEST_PAPER source",
    "Board is not allowed for this source",
    "Institution is not allowed for this source",
    "Year is not allowed for this source",
  ];

  return messages.includes(error.message) ? error.message : null;
}

export async function createQuestionPaperController(
  req: Request,
  res: Response,
): Promise<void> {
  const {
    class: classValue,
    subjectId,
    questionType,
    source,
    board,
    institution,
    year: yearValue,
  } = req.body as {
    class?: unknown;
    subjectId?: unknown;
    questionType?: unknown;
    source?: unknown;
    board?: unknown;
    institution?: unknown;
    year?: unknown;
  };

  if (typeof classValue !== "string" || classValue.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Class is required",
    });
    return;
  }

  const parsedSubjectId = Number(subjectId);

  if (!Number.isInteger(parsedSubjectId) || parsedSubjectId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid subjectId is required",
    });
    return;
  }

  if (!isQuestionType(questionType)) {
    res.status(400).json({
      success: false,
      message: "Valid questionType is required",
    });
    return;
  }

  if (!isQuestionSource(source)) {
    res.status(400).json({
      success: false,
      message: "Valid source is required",
    });
    return;
  }

  const parsedYear = parseYear(yearValue);

  if (
    yearValue !== undefined &&
    yearValue !== null &&
    yearValue !== "" &&
    parsedYear === undefined
  ) {
    res.status(400).json({
      success: false,
      message: "Year must be a valid integer",
    });
    return;
  }

  try {
    const questionPaper = await createQuestionPaper({
      class: classValue.trim(),
      subjectId: parsedSubjectId,
      questionType,
      source,
      board: typeof board === "string" ? board.trim() : null,
      institution: typeof institution === "string" ? institution.trim() : null,
      year: parsedYear ?? null,
    });

    res.status(201).json({
      success: true,
      message: "Question paper created successfully",
      data: questionPaper,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Subject not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    const validationMessage = getValidationMessage(error);

    if (validationMessage) {
      res.status(400).json({
        success: false,
        message: validationMessage,
      });
      return;
    }

    throw error;
  }
}

export async function getQuestionPapersController(
  req: Request,
  res: Response,
): Promise<void> {
  const subjectIdValue = req.query.subjectId;

  let subjectId: number | undefined;

  if (subjectIdValue !== undefined) {
    subjectId = Number(subjectIdValue);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid subjectId",
      });
      return;
    }
  }

  const questionPapers = await getQuestionPapers(subjectId);

  res.status(200).json({
    success: true,
    data: questionPapers,
  });
}

export async function getQuestionPaperController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid question paper ID",
    });
    return;
  }

  const questionPaper = await getQuestionPaper(id);

  if (!questionPaper) {
    res.status(404).json({
      success: false,
      message: "Question paper not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: questionPaper,
  });
}

export async function updateQuestionPaperController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid question paper ID",
    });
    return;
  }

  const {
    class: classValue,
    subjectId,
    questionType,
    source,
    board,
    institution,
    year: yearValue,
  } = req.body as {
    class?: unknown;
    subjectId?: unknown;
    questionType?: unknown;
    source?: unknown;
    board?: unknown;
    institution?: unknown;
    year?: unknown;
  };

  if (typeof classValue !== "string" || classValue.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Class is required",
    });
    return;
  }

  const parsedSubjectId = Number(subjectId);

  if (!Number.isInteger(parsedSubjectId) || parsedSubjectId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid subjectId is required",
    });
    return;
  }

  if (!isQuestionType(questionType)) {
    res.status(400).json({
      success: false,
      message: "Valid questionType is required",
    });
    return;
  }

  if (!isQuestionSource(source)) {
    res.status(400).json({
      success: false,
      message: "Valid source is required",
    });
    return;
  }

  const parsedYear = parseYear(yearValue);

  if (
    yearValue !== undefined &&
    yearValue !== null &&
    yearValue !== "" &&
    parsedYear === undefined
  ) {
    res.status(400).json({
      success: false,
      message: "Year must be a valid integer",
    });
    return;
  }

  try {
    const questionPaper = await updateQuestionPaper(id, {
      class: classValue.trim(),
      subjectId: parsedSubjectId,
      questionType,
      source,
      board: typeof board === "string" ? board.trim() : null,
      institution: typeof institution === "string" ? institution.trim() : null,
      year: parsedYear ?? null,
    });

    if (!questionPaper) {
      res.status(404).json({
        success: false,
        message: "Question paper not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Question paper updated successfully",
      data: questionPaper,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Subject not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    const validationMessage = getValidationMessage(error);

    if (validationMessage) {
      res.status(400).json({
        success: false,
        message: validationMessage,
      });
      return;
    }

    throw error;
  }
}

export async function deleteQuestionPaperController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid question paper ID",
    });
    return;
  }

  const deletedQuestionPaper = await deleteQuestionPaper(id);

  if (!deletedQuestionPaper) {
    res.status(404).json({
      success: false,
      message: "Question paper not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Question paper deleted successfully",
    data: deletedQuestionPaper,
  });
}

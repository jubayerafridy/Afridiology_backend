import type { Request, Response } from "express";

import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "./subject.service.js";

function parseUuid(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function createSubjectController(
  req: Request,
  res: Response,
): Promise<void> {
  const { educationLevelId, name } = req.body as {
    educationLevelId?: unknown;
    name?: unknown;
  };

  const parsedEducationLevelId = parseUuid(educationLevelId);

  if (parsedEducationLevelId === null) {
    res.status(400).json({
      success: false,
      message: "Valid educationLevelId is required",
    });

    return;
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Subject name is required",
    });

    return;
  }

  try {
    const subject = await createSubject({
      educationLevelId: parsedEducationLevelId,
      name: name.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Education level not found"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    throw error;
  }
}

export async function getSubjectsController(
  req: Request,
  res: Response,
): Promise<void> {
  const educationLevelIdValue = req.query.educationLevelId;

  let educationLevelId: string | undefined;

  if (educationLevelIdValue !== undefined) {
    const parsedEducationLevelId = parseUuid(educationLevelIdValue);

    if (parsedEducationLevelId === null) {
      res.status(400).json({
        success: false,
        message: "Invalid educationLevelId",
      });

      return;
    }

    educationLevelId = parsedEducationLevelId;
  }

  const subjects = await getSubjects(educationLevelId);

  res.status(200).json({
    success: true,
    data: subjects,
  });
}

export async function updateSubjectController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid subject ID",
    });

    return;
  }

  const { name } = req.body as {
    name?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Subject name is required",
    });

    return;
  }

  const subject = await updateSubject(id, {
    name: name.trim(),
  });

  if (!subject) {
    res.status(404).json({
      success: false,
      message: "Subject not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Subject updated successfully",
    data: subject,
  });
}

export async function deleteSubjectController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseUuid(req.params.id);

  if (id === null) {
    res.status(400).json({
      success: false,
      message: "Invalid subject ID",
    });

    return;
  }

  const deletedSubject = await deleteSubject(id);

  if (!deletedSubject) {
    res.status(404).json({
      success: false,
      message: "Subject not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Subject deleted successfully",
    data: deletedSubject,
  });
}

import type { Request, Response } from "express";

import {
  createSubject,
  deleteSubject,
  getSubjects,
} from "./subject.service.js";

export async function createSubjectController(
  req: Request,
  res: Response,
): Promise<void> {
  const { educationLevelId, name } = req.body as {
    educationLevelId?: unknown;
    name?: unknown;
  };

  const parsedEducationLevelId = Number(educationLevelId);

  if (
    !Number.isInteger(parsedEducationLevelId) ||
    parsedEducationLevelId <= 0
  ) {
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

  let educationLevelId: number | undefined;

  if (educationLevelIdValue !== undefined) {
    educationLevelId = Number(educationLevelIdValue);

    if (!Number.isInteger(educationLevelId) || educationLevelId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid educationLevelId",
      });

      return;
    }
  }

  const subjects = await getSubjects(educationLevelId);

  res.status(200).json({
    success: true,
    data: subjects,
  });
}

export async function deleteSubjectController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
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

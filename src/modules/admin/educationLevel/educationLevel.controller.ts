import type { Request, Response } from "express";

import {
  createEducationLevel,
  deleteEducationLevel,
  getEducationLevels,
  updateEducationLevel,
} from "./educationLevel.service.js";

export async function createEducationLevelController(
  req: Request,
  res: Response,
): Promise<void> {
  const { name } = req.body as {
    name?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Education level name is required",
    });

    return;
  }

  const educationLevel = await createEducationLevel({
    name: name.trim(),
  });

  res.status(201).json({
    success: true,
    message: "Education level created successfully",
    data: educationLevel,
  });
}

export async function getEducationLevelsController(
  _req: Request,
  res: Response,
): Promise<void> {
  const educationLevels = await getEducationLevels();

  res.status(200).json({
    success: true,
    data: educationLevels,
  });
}

export async function updateEducationLevelController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid education level ID",
    });

    return;
  }

  const { name } = req.body as {
    name?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Education level name is required",
    });

    return;
  }

  const educationLevel = await updateEducationLevel(id, {
    name: name.trim(),
  });

  if (!educationLevel) {
    res.status(404).json({
      success: false,
      message: "Education level not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Education level updated successfully",
    data: educationLevel,
  });
}

export async function deleteEducationLevelController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid education level ID",
    });

    return;
  }

  const deletedEducationLevel = await deleteEducationLevel(id);

  if (!deletedEducationLevel) {
    res.status(404).json({
      success: false,
      message: "Education level not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Education level deleted successfully",
    data: deletedEducationLevel,
  });
}

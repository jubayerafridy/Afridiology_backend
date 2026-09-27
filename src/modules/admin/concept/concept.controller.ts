import type { Request, Response } from "express";

import {
  createConcept,
  deleteConcept,
  getConcept,
  getConcepts,
  updateConcept,
} from "./concept.service.js";

export async function createConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const { lessonId, nameBN, nameEng, descriptionBN, descriptionEng } =
    req.body as {
      lessonId?: unknown;
      nameBN?: unknown;
      nameEng?: unknown;
      descriptionBN?: unknown;
      descriptionEng?: unknown;
    };

  const parsedLessonId = Number(lessonId);

  if (!Number.isInteger(parsedLessonId) || parsedLessonId <= 0) {
    res.status(400).json({
      success: false,
      message: "Valid lessonId is required",
    });

    return;
  }

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla concept name is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English concept name is required",
    });

    return;
  }

  if (typeof descriptionBN !== "string" || descriptionBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla concept description is required",
    });

    return;
  }

  if (
    typeof descriptionEng !== "string" ||
    descriptionEng.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      message: "English concept description is required",
    });

    return;
  }

  try {
    const concept = await createConcept({
      lessonId: parsedLessonId,
      nameBN: nameBN.trim(),
      nameEng: nameEng.trim(),
      descriptionBN: descriptionBN.trim(),
      descriptionEng: descriptionEng.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Concept created successfully",
      data: concept,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Lesson not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    throw error;
  }
}

export async function getConceptsController(
  req: Request,
  res: Response,
): Promise<void> {
  const lessonIdValue = req.query.lessonId;

  let lessonId: number | undefined;

  if (lessonIdValue !== undefined) {
    lessonId = Number(lessonIdValue);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid lessonId",
      });

      return;
    }
  }

  const concepts = await getConcepts(lessonId);

  res.status(200).json({
    success: true,
    data: concepts,
  });
}

export async function getConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid concept ID",
    });

    return;
  }

  const concept = await getConcept(id);

  if (!concept) {
    res.status(404).json({
      success: false,
      message: "Concept not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: concept,
  });
}

export async function updateConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid concept ID",
    });

    return;
  }

  const { nameBN, nameEng, descriptionBN, descriptionEng } = req.body as {
    nameBN?: unknown;
    nameEng?: unknown;
    descriptionBN?: unknown;
    descriptionEng?: unknown;
  };

  if (typeof nameBN !== "string" || nameBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla concept name is required",
    });

    return;
  }

  if (typeof nameEng !== "string" || nameEng.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "English concept name is required",
    });

    return;
  }

  if (typeof descriptionBN !== "string" || descriptionBN.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Bangla concept description is required",
    });

    return;
  }

  if (
    typeof descriptionEng !== "string" ||
    descriptionEng.trim().length === 0
  ) {
    res.status(400).json({
      success: false,
      message: "English concept description is required",
    });

    return;
  }

  const concept = await updateConcept(id, {
    nameBN: nameBN.trim(),
    nameEng: nameEng.trim(),
    descriptionBN: descriptionBN.trim(),
    descriptionEng: descriptionEng.trim(),
  });

  if (!concept) {
    res.status(404).json({
      success: false,
      message: "Concept not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Concept updated successfully",
    data: concept,
  });
}

export async function deleteConceptController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid concept ID",
    });

    return;
  }

  const deletedConcept = await deleteConcept(id);

  if (!deletedConcept) {
    res.status(404).json({
      success: false,
      message: "Concept not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "Concept deleted successfully",
    data: deletedConcept,
  });
}

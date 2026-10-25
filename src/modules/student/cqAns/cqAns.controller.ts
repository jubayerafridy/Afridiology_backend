import type { Request, Response } from "express";
import { getCQAnswer, type CQPart, type CQLanguage } from "./cqAns.service.js";

function parseParam(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isCQPart(value: string): value is CQPart {
  return value === "ka" || value === "kha" || value === "ga" || value === "gha";
}

function isCQLanguage(value: string): value is CQLanguage {
  return value === "BN" || value === "Eng";
}

export async function getCQAnswerController(req: Request, res: Response): Promise<void> {
  const cqId = parseParam(req.params.cqId);
  const partValue = parseParam(req.params.part);
  const languageValue = parseParam(req.query.language) ?? "BN";

  if (cqId === null) {
    res.status(400).json({
      success: false,
      message: "A valid cqId is required",
    });
    return;
  }

  if (partValue === null || !isCQPart(partValue)) {
    res.status(400).json({
      success: false,
      message: "part must be ka, kha, ga, or gha",
    });
    return;
  }

  if (!isCQLanguage(languageValue)) {
    res.status(400).json({
      success: false,
      message: "language must be BN or Eng",
    });
    return;
  }

  const answer = await getCQAnswer(cqId, partValue, languageValue);

  if (answer === null || answer === undefined) {
    res.status(404).json({
      success: false,
      message: "CQ or answer not found",
    });
    return;
  }

  // Return the stored answer JSON directly, without a wrapper.
  res.status(200).json(answer);
}

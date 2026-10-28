import type { Request, Response } from "express";
import { getCQAnswer, type CQPart, type CQLanguage } from "./cqAns.service.js";
import { isUuid } from "../student.validation.js";

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
  const rawLanguage = req.query.language;
  const languageValue = rawLanguage === undefined ? "BN" : parseParam(rawLanguage) ?? "";

  if (cqId === null || !isUuid(cqId)) {
    res.status(400).json("invalid request");
    return;
  }

  if (partValue === null || !isCQPart(partValue)) {
    res.status(400).json("invalid request");
    return;
  }

  if (!isCQLanguage(languageValue)) {
    res.status(400).json("invalid request");
    return;
  }

  const answer = await getCQAnswer(cqId, partValue, languageValue);

  if (answer === null || answer === undefined) {
    res.status(404).json("data not found");
    return;
  }

  // Return the stored answer JSON directly, without a wrapper.
  res.status(200).json(answer);
}

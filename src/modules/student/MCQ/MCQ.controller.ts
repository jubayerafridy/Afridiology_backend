import type { Request, Response } from "express";
import { getMCQDetail, type MCQLanguage } from "./MCQ.service.js";
import { isUuid } from "../student.validation.js";

function parseId(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return isUuid(id) ? id : null;
}

function parseLanguage(value: Request["query"]["language"]): MCQLanguage | null {
  if (value === undefined) return "bangla";
  if (typeof value !== "string") return null;
  const language = value.trim();
  return language === "bangla" || language === "english" ? language : null;
}

export async function getMCQDetailController(req: Request, res: Response): Promise<void> {
  try {
    const id = parseId(req.params.id);
    const language = parseLanguage(req.query.language);

    if (id === null) {
      res.status(400).json("invalid request");
      return;
    }
    if (language === null) {
      res.status(400).json("invalid request");
      return;
    }

    const mcq = await getMCQDetail(id, language);
    if (!mcq) {
      res.status(404).json("data not found");
      return;
    }

    res.status(200).json(mcq);
  } catch (error) {
    console.error("getMCQDetailController error:", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

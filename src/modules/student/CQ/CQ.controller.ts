import type { Request, Response } from "express";
import { getCQDetail, type CQLanguage } from "./CQ.service.js";
import { isUuid } from "../student.validation.js";

function parseId(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return isUuid(id) ? id : null;
}

function parseLanguage(value: Request["query"]["language"]): CQLanguage | null {
  if (value === undefined) return "bangla";
  if (typeof value !== "string") return null;
  const language = value.trim();
  return language === "bangla" || language === "english" ? language : null;
}

export async function getCQDetailController(req: Request, res: Response): Promise<void> {
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

    const cq = await getCQDetail(id, language);
    if (!cq) {
      res.status(404).json("data not found");
      return;
    }

    res.status(200).json(cq);
  } catch (error) {
    console.error("getCQDetailController error:", error instanceof Error ? error.name : typeof error);
    res.status(500).json("error response");
  }
}

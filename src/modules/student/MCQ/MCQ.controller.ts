import type { Request, Response } from "express";
import { getMCQDetail, type MCQLanguage } from "./MCQ.service.js";

function parseId(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id.length > 0 ? id : null;
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
      res.status(400).json({ success: false, message: "Invalid MCQ ID" });
      return;
    }
    if (language === null) {
      res.status(400).json({ success: false, message: "language must be bangla or english" });
      return;
    }

    const mcq = await getMCQDetail(id, language);
    if (!mcq) {
      res.status(404).json({ success: false, message: "MCQ not found" });
      return;
    }

    res.status(200).json({ success: true, data: mcq });
  } catch (error) {
    console.error("getMCQDetailController error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

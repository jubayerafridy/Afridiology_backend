import type { Request, Response } from "express";
import { getCQDetail, type CQLanguage } from "./CQ.service.js";

function parseId(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id.length > 0 ? id : null;
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
      res.status(400).json({ success: false, message: "Invalid CQ ID" });
      return;
    }
    if (language === null) {
      res.status(400).json({ success: false, message: "language must be bangla or english" });
      return;
    }

    const cq = await getCQDetail(id, language);
    if (!cq) {
      res.status(404).json({ success: false, message: "CQ not found" });
      return;
    }

    res.status(200).json({ success: true, data: cq });
  } catch (error) {
    console.error("getCQDetailController error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

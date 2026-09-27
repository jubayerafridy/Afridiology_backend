import type { Request, Response } from "express";

import {
  getChapterKnowledgeGraph,
  getCQDetail,
  getMCQDetail,
} from "./knowledgeGraph.service.js";

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

function getParam(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function parsePositiveInt(value: string | string[] | undefined): number | null {
  const param = getParam(value);

  if (param === null) {
    return null;
  }

  const parsed = Number(param);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/*
 * ==================================================
 * CHAPTER GRAPH
 * ==================================================
 */

export async function getChapterKnowledgeGraphController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const chapterId = parsePositiveInt(req.params.chapterId);

    if (chapterId === null) {
      res.status(400).json({
        success: false,
        message: "Invalid chapter ID",
      });
      return;
    }

    const graph = await getChapterKnowledgeGraph(chapterId);

    if (!graph) {
      res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: graph,
    });
  } catch (error) {
    console.error("getChapterKnowledgeGraphController error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/*
 * ==================================================
 * CQ DETAIL
 * ==================================================
 */

export async function getCQDetailController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = parsePositiveInt(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid CQ ID",
      });
      return;
    }

    const cq = await getCQDetail(id);

    if (!cq) {
      res.status(404).json({
        success: false,
        message: "CQ not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cq,
    });
  } catch (error) {
    console.error("getCQDetailController error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/*
 * ==================================================
 * MCQ DETAIL
 * ==================================================
 */

export async function getMCQDetailController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = parsePositiveInt(req.params.id);

    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid MCQ ID",
      });
      return;
    }

    const mcq = await getMCQDetail(id);

    if (!mcq) {
      res.status(404).json({
        success: false,
        message: "MCQ not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: mcq,
    });
  } catch (error) {
    console.error("getMCQDetailController error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

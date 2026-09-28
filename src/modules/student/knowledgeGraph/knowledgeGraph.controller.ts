import type { Request, Response } from "express";

import {
  getChapterKnowledgeGraph,
  getCQDetail,
  getMCQDetail,
} from "./knowledgeGraph.service.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    role: string;
    sessionId: number;
  };
}

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
 * OPTIONAL AUTHENTICATED USER
 * ==================================================
 *
 * IMPORTANT:
 *
 * The Knowledge Graph route remains PUBLIC.
 *
 * optionalAuthenticate middleware may attach:
 *
 * req.auth = {
 *   userId,
 *   role,
 *   sessionId,
 * }
 *
 * If the visitor is anonymous, req.auth is undefined.
 *
 * Therefore:
 *
 * PUBLIC USER
 *   ↓
 * no userId
 *   ↓
 * no bookmark queries
 *
 * LOGGED-IN USER
 *   ↓
 * userId
 *   ↓
 * bookmark-aware graph
 */

function getOptionalAuthenticatedUserId(req: Request): number | undefined {
  const authenticatedRequest = req as AuthenticatedRequest;

  const auth = authenticatedRequest.auth;

  if (!auth) {
    return undefined;
  }

  if (!Number.isInteger(auth.userId) || auth.userId <= 0) {
    return undefined;
  }

  return auth.userId;
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

    /*
     * Authentication is OPTIONAL.
     *
     * We intentionally do not reject the request when
     * there is no authenticated user.
     */
    const userId = getOptionalAuthenticatedUserId(req);

    /*
     * The service receives undefined for anonymous users.
     *
     * In that case the service does not perform any
     * bookmark queries.
     */
    const graph = await getChapterKnowledgeGraph(chapterId, userId);

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

import type { Request, Response } from "express";

import {
  getChapterKnowledgeGraph,
  type KnowledgeGraphLanguage,
} from "./knowledgeGraph.service.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
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

function parseUuid(value: string | string[] | undefined): string | null {
  const param = getParam(value);

  if (param === null) {
    return null;
  }

  const parsed = param.trim();

  if (parsed.length === 0) {
    return null;
  }

  return parsed;
}

function parseLanguage(value: Request["query"]["language"]): KnowledgeGraphLanguage | null {
  if (value === undefined) return "bangla";
  if (typeof value !== "string") return null;
  const language = value.trim();
  return language === "bangla" || language === "english" ? language : null;
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

function getOptionalAuthenticatedUserId(req: Request): string | undefined {
  const authenticatedRequest = req as AuthenticatedRequest;

  const auth = authenticatedRequest.auth;

  if (!auth) {
    return undefined;
  }

  if (typeof auth.userId !== "string" || auth.userId.trim().length === 0) {
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
    const chapterId = parseUuid(req.params.chapterId);
    const language = parseLanguage(req.query.language);

    if (chapterId === null) {
      res.status(400).json({
        success: false,
        message: "Invalid chapter ID",
      });

      return;
    }

    if (language === null) {
      res.status(400).json({ success: false, message: "language must be bangla or english" });
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
    const graph = await getChapterKnowledgeGraph(chapterId, language, userId);

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


import type { Request, Response } from "express";

import { getAdminChapterKnowledgeGraph } from "./adminknowledgeGraph.service.js";

/*
 * ==================================================
 * GET ADMIN KNOWLEDGE GRAPH
 * ==================================================
 *
 * GET
 * /admin/knowledge-graph?chapterId=123
 *
 * Returns the complete admin knowledge hierarchy:
 *
 * Chapter
 *   └── Chapter.structure
 *         ├── content
 *         ├── Lesson
 *         │     └── Lesson.structure
 *         │           ├── content
 *         │           └── Concept
 *         │                 └── Concept.structure
 *         │                       ├── content
 *         │                       └── Execution / Math
 *         │                             └── Execution.structure
 *         │
 *         └── content
 *
 * The JSONB `structure` of each hierarchy entity is
 * authoritative for the ordering.
 *
 * --------------------------------------------------
 *
 * Example Chapter.structure:
 *
 * [
 *   {
 *     "id": 1,
 *     "type": "text",
 *     "content": {
 *       "bn": "...",
 *       "eng": "..."
 *     }
 *   },
 *   {
 *     "id": 2,
 *     "type": "lesson",
 *     "lessonID": 45
 *   },
 *   {
 *     "id": 3,
 *     "type": "text",
 *     "content": {
 *       "bn": "...",
 *       "eng": "..."
 *     }
 *   },
 *   {
 *     "id": 4,
 *     "type": "lesson",
 *     "lessonID": 46
 *   }
 * ]
 *
 * The service resolves those IDs into the actual
 * Lesson / Concept / Execution graph nodes.
 *
 * --------------------------------------------------
 *
 * Connected:
 *
 * CQ
 *
 * MCQ is intentionally not included yet.
 *
 * --------------------------------------------------
 *
 * This controller is READ ONLY.
 *
 * CRUD is handled by:
 *
 * /admin/chapters
 * /admin/lessons
 * /admin/concepts
 * /admin/executions
 * /admin/cqs
 *
 * Structure synchronization is handled by the
 * corresponding hierarchy services.
 * ==================================================
 */

export async function getAdminKnowledgeGraphController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    /*
     * --------------------------------------------------
     * Validate chapterId existence
     * --------------------------------------------------
     */

    const rawChapterId = req.query.chapterId;

    if (rawChapterId === undefined) {
      res.status(400).json({
        success: false,
        message: "chapterId is required.",
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Convert chapterId to number
     * --------------------------------------------------
     */

    const chapterId = Number(rawChapterId);

    /*
     * --------------------------------------------------
     * Validate chapterId
     * --------------------------------------------------
     */

    if (!Number.isInteger(chapterId) || chapterId <= 0) {
      res.status(400).json({
        success: false,
        message: "chapterId must be a positive integer.",
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Build complete admin graph
     * --------------------------------------------------
     *
     * The service:
     *
     * 1. Reads Chapter.structure.
     * 2. Resolves Lesson references.
     * 3. Reads each Lesson.structure.
     * 4. Resolves Concept references.
     * 5. Reads each Concept.structure.
     * 6. Resolves Execution references.
     * 7. Reads Execution.structure.
     * 8. Adds connected CQs.
     *
     * Structure ordering is preserved.
     */

    const graph = await getAdminChapterKnowledgeGraph(chapterId);

    /*
     * --------------------------------------------------
     * Chapter not found
     * --------------------------------------------------
     */

    if (!graph) {
      res.status(404).json({
        success: false,
        message: "Chapter not found.",
      });

      return;
    }

    /*
     * --------------------------------------------------
     * Success
     * --------------------------------------------------
     */

    res.status(200).json({
      success: true,
      data: graph,
    });
  } catch (error) {
    console.error("Error fetching admin knowledge graph:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin knowledge graph.",
    });
  }
}

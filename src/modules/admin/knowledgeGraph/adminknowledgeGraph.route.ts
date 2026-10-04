import { Router } from "express";

import { getAdminKnowledgeGraphController } from "./adminknowledgeGraph.controller.js";

/*
 * ==================================================
 * ADMIN KNOWLEDGE GRAPH ROUTER
 * ==================================================
 *
 * GET
 * /admin/knowledge-graph?chapterId=123
 *
 * Read-only graph projection.
 *
 * Hierarchy/order is resolved from the JSONB
 * `structure` fields of:
 *
 * Chapter
 *   └── Lesson
 *         └── Concept
 *               └── Execution / Math
 *
 * The graph also includes connected CQ nodes.
 *
 * --------------------------------------------------
 *
 * CRUD operations remain separated:
 *
 * /admin/chapters
 * /admin/lessons
 * /admin/concepts
 * /admin/executions
 * /admin/cqs
 *
 * --------------------------------------------------
 *
 * This router intentionally contains no hierarchy
 * or structure manipulation logic.
 *
 * Structure resolution is handled by:
 *
 * adminknowledgeGraph.service.ts
 *
 * Request validation and response handling are
 * handled by:
 *
 * adminknowledgeGraph.controller.ts
 * ==================================================
 */

const knowledgeGraphRouter = Router();

/*
 * --------------------------------------------------
 * GET ADMIN KNOWLEDGE GRAPH
 * --------------------------------------------------
 *
 * Example:
 *
 * GET /admin/knowledge-graph?chapterId=123
 *
 * The controller validates chapterId and delegates
 * the graph construction to the service.
 */

knowledgeGraphRouter.get("/", getAdminKnowledgeGraphController);

export default knowledgeGraphRouter;

import { Router } from "express";

import { optionalAuthenticate } from "../../../middleware/optionalAuthenticate.js";

import {
  getChapterKnowledgeGraphController,
  getCQDetailController,
  getMCQDetailController,
} from "./knowledgeGraph.controller.js";

const knowledgeGraphRouter = Router();

/*
 * ==================================================
 * OPTIONAL AUTHENTICATION
 * ==================================================
 *
 * The knowledge graph remains publicly accessible.
 *
 * - Anonymous visitor → req.auth is undefined
 * - Logged-in visitor → req.auth contains user/session data
 *
 * Invalid authentication does not block the public graph.
 */
knowledgeGraphRouter.use(optionalAuthenticate);

/*
 * ==================================================
 * KNOWLEDGE GRAPH
 * ==================================================
 */

knowledgeGraphRouter.get(
  "/chapters/:chapterId",
  getChapterKnowledgeGraphController,
);

/*
 * ==================================================
 * QUESTION DETAILS
 * ==================================================
 */

knowledgeGraphRouter.get("/cqs/:id", getCQDetailController);

knowledgeGraphRouter.get("/mcqs/:id", getMCQDetailController);

export default knowledgeGraphRouter;

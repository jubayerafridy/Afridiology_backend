import { Router } from "express";

import {
  getChapterKnowledgeGraphController,
  getCQDetailController,
  getMCQDetailController,
} from "./knowledgeGraph.controller.js";

const knowledgeGraphRouter = Router();

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

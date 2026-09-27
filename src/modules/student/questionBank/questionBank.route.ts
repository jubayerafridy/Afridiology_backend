import { Router } from "express";

import {
  boardPapersController,
  paperCQsController,
  paperMCQsController,
  testPapersController,
} from "./questionBank.controller.js";

const router = Router();

/* =========================================================
 * PAPER INDEX
 * ========================================================= */

router.get("/board-papers", boardPapersController);

router.get("/test-papers", testPapersController);

/* =========================================================
 * INDIVIDUAL PAPER QUESTIONS
 * ========================================================= */

router.get("/papers/:paperId/cqs", paperCQsController);

router.get("/papers/:paperId/mcqs", paperMCQsController);

export default router;

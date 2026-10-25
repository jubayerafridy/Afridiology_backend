import { Router } from "express";

import { boardPapersController, paperCQsController, paperMCQsController, testPapersController } from "./questionBank.controller.js";

const router = Router();

/* =========================================================
 * PAPER INDEX
 * ========================================================= */

// Returns board papers for a subject.
// The type query parameter is now optional.
router.get("/board-papers", boardPapersController);

// Returns test papers filtered by subject and question type.
router.get("/test-papers", testPapersController);

/* =========================================================
 * INDIVIDUAL PAPER QUESTIONS
 * ========================================================= */

// Returns CQ questions for a paper in the requested language.
router.get("/papers/:paperId/cqs", paperCQsController);

// Returns MCQ questions for a paper in the requested language.
router.get("/papers/:paperId/mcqs", paperMCQsController);

export default router;

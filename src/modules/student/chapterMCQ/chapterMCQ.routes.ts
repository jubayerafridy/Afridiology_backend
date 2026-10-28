import { Router } from "express";

import { getChapterMCQsController } from "./chapterMCQ.controller.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

const router = Router();

router.get("/:chapterId", getChapterMCQsController);
router.use(studentErrorHandler);

export default router;

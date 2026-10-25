import { Router } from "express";

import { getChapterMCQsController } from "./chapterMCQ.controller.js";

const router = Router();

router.get("/:chapterId", getChapterMCQsController);

export default router;

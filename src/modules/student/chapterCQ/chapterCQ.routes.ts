import { Router } from "express";
import { getChapterCQsController } from "./chapterCQ.controller.js";

const router = Router();

router.get("/:chapterId", getChapterCQsController);

export default router;

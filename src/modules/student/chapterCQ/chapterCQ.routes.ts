import { Router } from "express";
import { getChapterCQsController } from "./chapterCQ.controller.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

const router = Router();

router.get("/:chapterId", getChapterCQsController);
router.use(studentErrorHandler);

export default router;

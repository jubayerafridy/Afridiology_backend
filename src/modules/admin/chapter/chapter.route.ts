import { Router } from "express";

import {
  createChapterController,
  deleteChapterController,
  getChaptersController,
  updateChapterController,
} from "./chapter.controller.js";

const chapterRouter = Router();

chapterRouter.get("/", getChaptersController);

chapterRouter.post("/", createChapterController);

chapterRouter.put("/:id", updateChapterController);

chapterRouter.delete("/:id", deleteChapterController);

export default chapterRouter;

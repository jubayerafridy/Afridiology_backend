import { Router } from "express";

import {
  createLessonController,
  deleteLessonController,
  getLessonController,
  getLessonsController,
  updateLessonController,
} from "./lesson.controller.js";

const lessonRouter = Router();

lessonRouter.get("/", getLessonsController);
lessonRouter.get("/:id", getLessonController);

lessonRouter.post("/", createLessonController);

lessonRouter.put("/:id", updateLessonController);

lessonRouter.delete("/:id", deleteLessonController);

export default lessonRouter;

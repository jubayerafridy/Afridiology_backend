import { Router } from "express";

import {
  createEducationLevelController,
  deleteEducationLevelController,
  getEducationLevelsController,
  updateEducationLevelController,
} from "./educationLevel.controller.js";

const educationLevelRouter = Router();

educationLevelRouter.get("/", getEducationLevelsController);

educationLevelRouter.post("/", createEducationLevelController);

educationLevelRouter.put("/:id", updateEducationLevelController);

educationLevelRouter.delete("/:id", deleteEducationLevelController);

export default educationLevelRouter;

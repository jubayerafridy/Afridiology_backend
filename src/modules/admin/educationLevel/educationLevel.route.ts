import { Router } from "express";

import {
  createEducationLevelController,
  deleteEducationLevelController,
  getEducationLevelsController,
} from "./educationLevel.controller.js";

const educationLevelRouter = Router();

educationLevelRouter.get("/", getEducationLevelsController);

educationLevelRouter.post("/", createEducationLevelController);

educationLevelRouter.delete("/:id", deleteEducationLevelController);

export default educationLevelRouter;

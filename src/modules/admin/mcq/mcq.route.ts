import { Router } from "express";

import {
  createMCQController,
  deleteMCQController,
  getMCQController,
  getMCQsController,
  updateMCQController,
} from "./mcq.controller.js";

const mcqRouter = Router();

mcqRouter.get("/", getMCQsController);

mcqRouter.get("/:id", getMCQController);

mcqRouter.post("/", createMCQController);

mcqRouter.put("/:id", updateMCQController);

mcqRouter.delete("/:id", deleteMCQController);

export default mcqRouter;

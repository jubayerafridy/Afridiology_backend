import { Router } from "express";

import {
  createMCQController,
  deleteMCQController,
  getMCQController,
  getMCQsController,
  updateMCQController,
  updateMCQsController,
} from "./mcq.controller.js";

const mcqRouter = Router();

mcqRouter.get("/", getMCQsController);

// Bulk update multiple MCQs
mcqRouter.post("/bulk-update", updateMCQsController);

mcqRouter.get("/:id", getMCQController);

mcqRouter.post("/", createMCQController);

mcqRouter.put("/:id", updateMCQController);

mcqRouter.delete("/:id", deleteMCQController);

export default mcqRouter;

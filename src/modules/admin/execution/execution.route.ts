import { Router } from "express";

import {
  createExecutionController,
  deleteExecutionController,
  getExecutionsController,
} from "./execution.controller.js";

const executionRouter = Router();

executionRouter.get("/", getExecutionsController);

executionRouter.post("/", createExecutionController);

executionRouter.delete("/:id", deleteExecutionController);

export default executionRouter;

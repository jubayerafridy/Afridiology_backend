import { Router } from "express";

import {
  createCQController,
  deleteCQController,
  getCQController,
  getCQsController,
  updateCQController,
} from "./cq.controller.js";

const cqRouter = Router();

cqRouter.get("/", getCQsController);

cqRouter.get("/:id", getCQController);

cqRouter.post("/", createCQController);

cqRouter.put("/:id", updateCQController);

cqRouter.delete("/:id", deleteCQController);

export default cqRouter;

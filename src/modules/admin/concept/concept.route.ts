import { Router } from "express";

import {
  createConceptController,
  deleteConceptController,
  getConceptController,
  getConceptsController,
  updateConceptController,
} from "./concept.controller.js";

const conceptRouter = Router();

conceptRouter.get("/", getConceptsController);

conceptRouter.get("/:id", getConceptController);

conceptRouter.post("/", createConceptController);

conceptRouter.put("/:id", updateConceptController);

conceptRouter.delete("/:id", deleteConceptController);

export default conceptRouter;

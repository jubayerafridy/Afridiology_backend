import { Router } from "express";

import {
  createSubjectController,
  deleteSubjectController,
  getSubjectsController,
  updateSubjectController,
} from "./subject.controller.js";

const subjectRouter = Router();

subjectRouter.get("/", getSubjectsController);

subjectRouter.post("/", createSubjectController);

subjectRouter.put("/:id", updateSubjectController);

subjectRouter.delete("/:id", deleteSubjectController);

export default subjectRouter;

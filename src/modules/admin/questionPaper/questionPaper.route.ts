import { Router } from "express";

import {
  createQuestionPaperController,
  deleteQuestionPaperController,
  getQuestionPaperController,
  getQuestionPapersController,
  updateQuestionPaperController,
} from "./questionPaper.controller.js";

const questionPaperRouter = Router();

questionPaperRouter.get("/", getQuestionPapersController);

questionPaperRouter.get("/:id", getQuestionPaperController);

questionPaperRouter.post("/", createQuestionPaperController);

questionPaperRouter.put("/:id", updateQuestionPaperController);

questionPaperRouter.delete("/:id", deleteQuestionPaperController);

export default questionPaperRouter;

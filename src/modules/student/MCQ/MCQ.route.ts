import { Router } from "express";
import { getMCQDetailController } from "./MCQ.controller.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

const router = Router();

router.get("/:id", getMCQDetailController);
router.use(studentErrorHandler);

export default router;

import { Router } from "express";
import { getCQAnswerController } from "./cqAns.controller.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

const router = Router();

router.get("/:cqId/:part", getCQAnswerController);
router.use(studentErrorHandler);

export default router;

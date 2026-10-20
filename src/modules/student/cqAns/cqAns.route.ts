import { Router } from "express";
import { getCQAnswerController } from "./cqAns.controller.js";

const router = Router();

router.get("/:cqId/:part", getCQAnswerController);

export default router;

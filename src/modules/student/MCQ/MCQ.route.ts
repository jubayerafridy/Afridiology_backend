import { Router } from "express";
import { getMCQDetailController } from "./MCQ.controller.js";

const router = Router();

router.get("/:id", getMCQDetailController);

export default router;

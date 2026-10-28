import { Router } from "express";
import { getCQDetailController } from "./CQ.controller.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

const router = Router();

router.get("/:id", getCQDetailController);
router.use(studentErrorHandler);

export default router;

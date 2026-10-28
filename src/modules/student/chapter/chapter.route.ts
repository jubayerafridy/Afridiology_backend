import { Router } from "express";

import { getChaptersController } from "./chapter.controller.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

const router = Router();

router.get("/", getChaptersController);
router.use(studentErrorHandler);

export default router;

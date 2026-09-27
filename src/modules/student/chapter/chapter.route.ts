import { Router } from "express";

import { getChaptersController } from "./chapter.controller.js";

const router = Router();

router.get("/", getChaptersController);

export default router;

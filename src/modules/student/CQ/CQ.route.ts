import { Router } from "express";
import { getCQDetailController } from "./CQ.controller.js";

const router = Router();

router.get("/:id", getCQDetailController);

export default router;

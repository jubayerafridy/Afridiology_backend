import { Router } from "express";

import { authenticate } from "../../../middleware/authenticate.js";

import {
  getQuestionProgressController,
  setQuestionProgressController,
} from "./questionProgress.controller.js";

const router = Router();

/*
 * ==================================================
 * AUTHENTICATION
 * ==================================================
 *
 * Every question-progress endpoint requires
 * an authenticated user.
 *
 * authenticate() attaches:
 *
 * req.auth = {
 *   userId,
 *   role,
 *   sessionId,
 * }
 */
router.use(authenticate);

/*
 * ==================================================
 * QUESTION PROGRESS
 * ==================================================
 */

/* GET progress for one target */
router.get("/:targetType/:targetId", getQuestionProgressController);

/* CREATE / UPDATE progress */
router.put("/", setQuestionProgressController);

export default router;

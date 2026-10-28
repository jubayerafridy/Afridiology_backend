import { Router } from "express";

import { authenticate } from "../../../middleware/authenticate.js";
import { requireActiveUser } from "../../../middleware/requireActiveUser.js";
import { studentErrorHandler } from "../studentErrorHandler.js";

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
router.use(requireActiveUser);

/*
 * ==================================================
 * QUESTION PROGRESS
 * ==================================================
 */

/* GET progress for one target */
router.get("/:targetType/:targetId", getQuestionProgressController);

/* CREATE / UPDATE progress */
router.put("/", setQuestionProgressController);
router.use(studentErrorHandler);

export default router;

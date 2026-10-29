import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";

import educationLevelRouter from "../modules/admin/educationLevel/educationLevel.route.js";
import subjectRouter from "../modules/admin/subject/subject.route.js";
import chapterRouter from "../modules/admin/chapter/chapter.route.js";
import lessonRouter from "../modules/admin/lesson/lesson.route.js";
import conceptRouter from "../modules/admin/concept/concept.route.js";
import executionRouter from "../modules/admin/execution/execution.route.js";
import questionPaperRouter from "../modules/admin/questionPaper/questionPaper.route.js";
import cqRouter from "../modules/admin/cq/cq.route.js";
import mcqRouter from "../modules/admin/mcq/mcq.route.js";
import adminKnowledgeGraphRouter from "../modules/admin/knowledgeGraph/adminknowledgeGraph.route.js";

import authRouter from "../modules/auth/auth.route.js";

import studentChapterRouter from "../modules/student/chapter/chapter.route.js";
import knowledgeGraphRouter from "../modules/student/knowledgeGraph/knowledgeGraph.route.js";
import studentCQRouter from "../modules/student/CQ/CQ.route.js";
import studentMCQRouter from "../modules/student/MCQ/MCQ.route.js";
import studentQuestionBankRouter from "../modules/student/questionBank/questionBank.route.js";

import bookmarkRouter from "../modules/student/bookmark/bookmark.route.js";
import questionProgressRouter from "../modules/student/questionProgress/questionProgress.routes.js";

import cqAnsRouter from "../modules/student/cqAns/cqAns.route.js";

import chapterCQRoutes from "../modules/student/chapterCQ/chapterCQ.routes.js";
import chapterMCQRoutes from "../modules/student/chapterMCQ/chapterMCQ.routes.js";

const router = Router();

/*
 * ==================================================
 * AUTH
 * ==================================================
 *
 * Student registration remains public.
 * The registration service must always assign STUDENT
 * as the role and must never accept a client-supplied role.
 *
 */

router.use("/auth", authRouter);

/*
 * ==================================================
 * ADMIN AUTHORIZATION GUARD
 * ==================================================
 *
 * All /admin/* API endpoints require:
 * 1. A valid access token.
 * 2. An active user account.
 * 3. The ADMIN or SUPER_ADMIN role.
 *
 * Keep this guard BEFORE all admin route registrations.
 *
 */

router.use("/admin", authenticate, requireActiveUser, authorize("ADMIN", "SUPER_ADMIN"));

/*
 * ==================================================
 * ADMIN ROUTES
 * ==================================================
 *
 * These routes inherit the authorization guard above.
 *
 */

router.use("/admin/education-levels", educationLevelRouter);

router.use("/admin/subjects", subjectRouter);

router.use("/admin/chapters", chapterRouter);

router.use("/admin/lessons", lessonRouter);

router.use("/admin/concepts", conceptRouter);

router.use("/admin/executions", executionRouter);

router.use("/admin/question-papers", questionPaperRouter);

router.use("/admin/cqs", cqRouter);

router.use("/admin/mcqs", mcqRouter);

router.use("/admin/knowledge-graph", adminKnowledgeGraphRouter);

/*
 * ==================================================
 * STUDENT ROUTES
 * ==================================================
 *
 * These routes remain outside the admin guard.
 * Each route must still enforce authentication and
 * ownership where the operation requires it.
 *
 */

router.use("/chapters", studentChapterRouter);

router.use("/knowledge-graph", knowledgeGraphRouter);

// Keep the former detail URLs working while their
// handlers live in the dedicated CQ and MCQ modules.
router.use("/knowledge-graph/cqs", studentCQRouter);

router.use("/knowledge-graph/mcqs", studentMCQRouter);

router.use("/cqs", studentCQRouter);

router.use("/mcqs", studentMCQRouter);

router.use("/question-bank", studentQuestionBankRouter);

router.use("/bookmarks", bookmarkRouter);

router.use("/question-progress", questionProgressRouter);

router.use("/cq-answers", cqAnsRouter);

router.use("/student/chapter-cq", chapterCQRoutes);

router.use("/student/chapter-mcq", chapterMCQRoutes);

export default router;

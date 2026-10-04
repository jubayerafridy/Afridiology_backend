import { Router } from "express";

import educationLevelRouter from "../modules/admin/educationLevel/educationLevel.route.js";
import subjectRouter from "../modules/admin/subject/subject.route.js";
import chapterRouter from "../modules/admin/chapter/chapter.route.js";
import lessonRouter from "../modules/admin/lesson/lesson.route.js";
import conceptRouter from "../modules/admin/concept/concept.route.js";
import executionRouter from "../modules/admin/execution/execution.route.js";
import questionPaperRouter from "../modules/admin/questionPaper/questionPaper.route.js";
import cqRouter from "../modules/admin/cq/cq.route.js";
import adminKnowledgeGraphRouter from "../modules/admin/knowledgeGraph/adminknowledgeGraph.route.js";

import authRouter from "../modules/auth/auth.route.js";

import studentChapterRouter from "../modules/student/chapter/chapter.route.js";
import knowledgeGraphRouter from "../modules/student/knowledgeGraph/knowledgeGraph.route.js";
import studentQuestionBankRouter from "../modules/student/questionBank/questionBank.route.js";

import bookmarkRouter from "../modules/student/bookmark/bookmark.route.js";
import questionProgressRouter from "../modules/student/questionProgress/questionProgress.routes.js";

const router = Router();

/*
 * ==================================================
 * AUTH
 * ==================================================
 */

router.use("/auth", authRouter);

/*
 * ==================================================
 * ADMIN
 * ==================================================
 */

router.use("/admin/education-levels", educationLevelRouter);

router.use("/admin/subjects", subjectRouter);

router.use("/admin/chapters", chapterRouter);

router.use("/admin/lessons", lessonRouter);

router.use("/admin/concepts", conceptRouter);

router.use("/admin/executions", executionRouter);

router.use("/admin/question-papers", questionPaperRouter);

router.use("/admin/cqs", cqRouter);

router.use("/admin/knowledge-graph", adminKnowledgeGraphRouter);

router.use("/chapters", studentChapterRouter);

router.use("/knowledge-graph", knowledgeGraphRouter);

router.use("/question-bank", studentQuestionBankRouter);

router.use("/bookmarks", bookmarkRouter);

router.use("/question-progress", questionProgressRouter);

export default router;

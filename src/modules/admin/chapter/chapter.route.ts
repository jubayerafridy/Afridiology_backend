import { Router } from "express";

import {
  createChapterController,
  deleteChapterController,
  getChaptersController,
  updateChapterController,
} from "./chapter.controller.js";

const chapterRouter = Router();

/**
 * ================================================================
 * CHAPTER ROUTES
 * ================================================================
 *
 * Chapter is the root of the curriculum hierarchy.
 *
 * Chapter
 *   └── descriptionBN / descriptionEng
 *         ├── content
 *         ├── {
 *         │     "type": "lesson",
 *         │     "lessonID": LESSON_ID
 *         │   }
 *         ├── content
 *         └── {
 *               "type": "lesson",
 *               "lessonID": LESSON_ID
 *             }
 *
 * The route layer only connects HTTP requests to the
 * corresponding controller.
 *
 * Chapter document management is handled by:
 *
 * chapter.service.ts
 *
 * Lesson / Concept / Execution CRUD remains in their
 * respective modules.
 *
 * Connected CQ / MCQ records are independent records and
 * are not hierarchy children.
 *
 * IMPORTANT:
 *
 * - No structure field is used.
 * - No flow field is used.
 * - Content blocks do not have artificial IDs.
 * - Array order is the source of truth.
 * - descriptionBN and descriptionEng contain the complete
 *   ordered Chapter documents.
 * ================================================================
 */

/*
 * ------------------------------------------------
 * GET CHAPTERS
 * ------------------------------------------------
 *
 * GET /admin/chapters
 *
 * Returns the available Chapters.
 *
 * The Chapter's descriptionBN / descriptionEng documents
 * determine the internal Lesson ordering.
 */

chapterRouter.get("/", getChaptersController);

/*
 * ------------------------------------------------
 * CREATE CHAPTER
 * ------------------------------------------------
 *
 * POST /admin/chapters
 *
 * Creates a Chapter with its initial:
 *
 * - descriptionBN
 * - descriptionEng
 *
 * The Chapter service owns document persistence.
 *
 * Lessons are added later as references:
 *
 * {
 *   "type": "lesson",
 *   "lessonID": LESSON_ID
 * }
 */

chapterRouter.post("/", createChapterController);

/*
 * ------------------------------------------------
 * UPDATE CHAPTER
 * ------------------------------------------------
 *
 * PUT /admin/chapters/:id
 *
 * Chapter metadata and ordered document updates are
 * handled by the Chapter controller/service.
 *
 * The complete ordered document is represented by:
 *
 * descriptionBN
 * descriptionEng
 */

chapterRouter.put("/:id", updateChapterController);

/*
 * ------------------------------------------------
 * DELETE CHAPTER
 * ------------------------------------------------
 *
 * DELETE /admin/chapters/:id
 *
 * Chapter deletion is handled by the Chapter service.
 *
 * Lower-level hierarchy CRUD and connected questions
 * are handled independently by their respective modules.
 */

chapterRouter.delete("/:id", deleteChapterController);

export default chapterRouter;

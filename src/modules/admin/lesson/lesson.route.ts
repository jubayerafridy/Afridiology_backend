import { Router } from "express";

import {
  createLessonController,
  deleteLessonController,
  getLessonController,
  getLessonsController,
  updateLessonController,
} from "./lesson.controller.js";

const lessonRouter = Router();

/**
 * ================================================================
 * LESSON ROUTES
 * ================================================================
 *
 * Lesson hierarchy:
 *
 * Chapter
 *   └── descriptionBN / descriptionEng
 *         └── {
 *               "type": "lesson",
 *               "lessonID": LESSON_ID
 *             }
 *
 * The route layer only connects HTTP requests to the
 * corresponding controller.
 *
 * Parent Chapter document synchronization is handled by:
 *
 * lesson.service.ts
 *
 * Connected CQ / MCQ records are independent records and are
 * not created, updated, or deleted by these hierarchy routes.
 *
 * Lesson's own ordered content is stored in:
 *
 * Lesson.descriptionBN
 * Lesson.descriptionEng
 *
 * Array order is the source of truth for Lesson document order.
 *
 * Content blocks do not have artificial IDs.
 * ================================================================
 */

/*
 * ------------------------------------------------
 * GET LESSONS
 * ------------------------------------------------
 *
 * GET /admin/lessons
 *
 * Returns all Lessons.
 *
 * GET /admin/lessons?chapterId=123
 *
 * Returns Lessons belonging to Chapter 123.
 *
 * Note:
 *
 * Database ID ordering is only used for normal CRUD listing.
 *
 * The Knowledge Graph/document system uses the Lesson reference
 * positions inside Chapter.descriptionBN / descriptionEng
 * to determine hierarchy/document order.
 */

lessonRouter.get("/", getLessonsController);

/*
 * ------------------------------------------------
 * GET SINGLE LESSON
 * ------------------------------------------------
 *
 * GET /admin/lessons/:id
 */

lessonRouter.get("/:id", getLessonController);

/*
 * ------------------------------------------------
 * CREATE LESSON
 * ------------------------------------------------
 *
 * POST /admin/lessons
 *
 * The controller validates the request.
 *
 * The service:
 *
 * 1. Creates the Lesson.
 * 2. Gets the generated Lesson ID.
 * 3. Adds:
 *
 *    {
 *      "type": "lesson",
 *      "lessonID": LESSON_ID
 *    }
 *
 *    to both the parent Chapter.descriptionBN and
 *    Chapter.descriptionEng documents.
 */

lessonRouter.post("/", createLessonController);

/*
 * ------------------------------------------------
 * UPDATE LESSON
 * ------------------------------------------------
 *
 * PUT /admin/lessons/:id
 *
 * Updating a Lesson does not modify the Lesson reference
 * inside the parent Chapter because the Lesson database ID
 * remains unchanged.
 *
 * The Lesson's own descriptionBN / descriptionEng documents
 * may be replaced by the update request.
 */

lessonRouter.put("/:id", updateLessonController);

/*
 * ------------------------------------------------
 * DELETE LESSON
 * ------------------------------------------------
 *
 * DELETE /admin/lessons/:id
 *
 * The service:
 *
 * 1. Removes the Lesson reference from both parent
 *    Chapter.descriptionBN and Chapter.descriptionEng.
 * 2. Deletes the Lesson entity.
 *
 * Connected CQ / MCQ records remain untouched.
 */

lessonRouter.delete("/:id", deleteLessonController);

export default lessonRouter;

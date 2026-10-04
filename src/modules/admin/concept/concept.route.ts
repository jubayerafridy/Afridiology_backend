import { Router } from "express";

import {
  createConceptController,
  deleteConceptController,
  getConceptController,
  getConceptsController,
  updateConceptController,
} from "./concept.controller.js";

const conceptRouter = Router();

/**
 * ================================================================
 * CONCEPT ROUTES
 * ================================================================
 *
 * Concept hierarchy:
 *
 * Lesson
 *   └── Lesson.descriptionBN / descriptionEng
 *         └── {
 *               "type": "concept",
 *               "conceptID": CONCEPT_ID
 *             }
 *
 * The route layer only connects HTTP requests to the
 * corresponding controller.
 *
 * Parent Lesson document synchronization is handled by:
 *
 * concept.service.ts
 *
 * Connected CQ / MCQ records are independent records and are
 * not created, updated, or deleted by these hierarchy routes.
 *
 * Document order is determined by the position of the Concept
 * reference inside the parent's description arrays.
 * ================================================================
 */

/*
 * ------------------------------------------------
 * GET CONCEPTS
 * ------------------------------------------------
 *
 * GET /admin/concepts
 *
 * Returns all Concepts.
 *
 * GET /admin/concepts?lessonId=123
 *
 * Returns Concepts belonging to Lesson 123.
 *
 * Note:
 *
 * The Knowledge Graph uses the parent Lesson's
 * descriptionBN / descriptionEng arrays for document
 * ordering rather than Concept database ID ordering.
 */

conceptRouter.get("/", getConceptsController);

/*
 * ------------------------------------------------
 * GET SINGLE CONCEPT
 * ------------------------------------------------
 *
 * GET /admin/concepts/:id
 */

conceptRouter.get("/:id", getConceptController);

/*
 * ------------------------------------------------
 * CREATE CONCEPT
 * ------------------------------------------------
 *
 * POST /admin/concepts
 *
 * The controller validates:
 *
 * - lessonId
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * No `structure` field is accepted.
 *
 * The service:
 *
 * 1. Verifies the parent Lesson.
 * 2. Creates the Concept.
 * 3. Saves its descriptionBN / descriptionEng documents.
 * 4. Gets the generated Concept ID.
 * 5. Adds:
 *
 *      {
 *        "type": "concept",
 *        "conceptID": CONCEPT_ID
 *      }
 *
 *    to both parent Lesson description arrays.
 */

conceptRouter.post("/", createConceptController);

/*
 * ------------------------------------------------
 * UPDATE CONCEPT
 * ------------------------------------------------
 *
 * PUT /admin/concepts/:id
 *
 * Updating a Concept updates:
 *
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * The parent Lesson reference does not need to change
 * because the Concept database ID remains unchanged.
 *
 * There is no Concept.structure field.
 */

conceptRouter.put("/:id", updateConceptController);

/*
 * ------------------------------------------------
 * DELETE CONCEPT
 * ------------------------------------------------
 *
 * DELETE /admin/concepts/:id
 *
 * The service:
 *
 * 1. Removes the Concept reference from the parent
 *    Lesson descriptionBN and descriptionEng arrays.
 * 2. Deletes the Concept entity.
 *
 * Connected CQ / MCQ records remain untouched.
 *
 * Questions are independent connected records rather
 * than hierarchy children.
 */

conceptRouter.delete("/:id", deleteConceptController);

export default conceptRouter;

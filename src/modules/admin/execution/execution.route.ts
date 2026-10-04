import { Router } from "express";

import {
  createExecutionController,
  deleteExecutionController,
  getExecutionController,
  getExecutionsController,
  updateExecutionController,
} from "./execution.controller.js";

const executionRouter = Router();

/*
 * ================================================================
 * EXECUTION ROUTES
 * ================================================================
 *
 * Execution hierarchy:
 *
 * Concept
 *   └── Concept.descriptionBN / descriptionEng
 *         └── {
 *               "type": "execution",
 *               "executionID": EXECUTION_ID
 *             }
 *
 * The route layer only connects HTTP requests to the
 * corresponding controller.
 *
 * Concept document synchronization is handled by:
 *
 * execution.service.ts
 *
 * CQ / MCQ records are independent connected records and are
 * not created, updated, or deleted by these hierarchy routes.
 *
 * There is no separate `structure` field.
 * There are no artificial block IDs.
 * Document array order is the source of truth.
 * ================================================================
 */

/*
 * ------------------------------------------------
 * GET EXECUTIONS
 * ------------------------------------------------
 *
 * GET /admin/executions
 *
 * Returns all executions.
 *
 * GET /admin/executions?conceptId=123
 *
 * Returns executions belonging to Concept 123.
 *
 * Note:
 *
 * Database ID order is only used for ordinary listing.
 *
 * The Knowledge Graph uses:
 *
 * Concept.descriptionBN
 * Concept.descriptionEng
 *
 * to determine where Execution references appear
 * inside the ordered Concept documents.
 */

executionRouter.get("/", getExecutionsController);

/*
 * ------------------------------------------------
 * GET SINGLE EXECUTION
 * ------------------------------------------------
 *
 * GET /admin/executions/:id
 *
 * Returns one Execution by database ID.
 *
 * This endpoint is required by the Knowledge Graph
 * content editor before updating an Execution.
 *
 * The frontend uses it to retrieve the existing:
 *
 * - nameBN
 * - nameEng
 *
 * before sending the updated:
 *
 * - descriptionBN
 * - descriptionEng
 */

executionRouter.get("/:id", getExecutionController);

/*
 * ------------------------------------------------
 * CREATE EXECUTION
 * ------------------------------------------------
 *
 * POST /admin/executions
 *
 * The controller validates:
 *
 * - conceptId
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * The service then:
 *
 * 1. Verifies the parent Concept.
 * 2. Creates the Execution.
 * 3. Gets its database ID.
 * 4. Adds:
 *
 *      {
 *        "type": "execution",
 *        "executionID": EXECUTION_ID
 *      }
 *
 *    to both:
 *
 *      Concept.descriptionBN
 *      Concept.descriptionEng
 *
 * Execution content itself is stored in:
 *
 *      Execution.descriptionBN
 *      Execution.descriptionEng
 */

executionRouter.post("/", createExecutionController);

/*
 * ------------------------------------------------
 * UPDATE EXECUTION
 * ------------------------------------------------
 *
 * PUT /admin/executions/:id
 *
 * Updating the Execution changes:
 *
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * It does not change the parent Concept reference
 * because the Execution database ID remains unchanged.
 *
 * There is no Execution.structure field.
 */

executionRouter.put("/:id", updateExecutionController);

/*
 * ------------------------------------------------
 * DELETE EXECUTION
 * ------------------------------------------------
 *
 * DELETE /admin/executions/:id
 *
 * The service:
 *
 * 1. Finds the Execution.
 * 2. Removes its reference from:
 *
 *      Concept.descriptionBN
 *      Concept.descriptionEng
 *
 * 3. Deletes the Execution entity.
 *
 * Connected CQ / MCQ records remain untouched.
 */

executionRouter.delete("/:id", deleteExecutionController);

export default executionRouter;

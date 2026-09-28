import { Router } from "express";

import { authenticate } from "../../../middleware/authenticate.js";

import {
  createBookmarkController,
  deleteBookmarkController,
  getBookmarkController,
  updateBookmarkController,
  createBookmarkCollectionController,
  deleteBookmarkCollectionController,
  getBookmarkCollectionController,
  getBookmarkCollectionsController,
  updateBookmarkCollectionController,
} from "./bookmark.controller.js";

const router = Router();

/*
 * ==================================================
 * AUTHENTICATION
 * ==================================================
 *
 * Every bookmark and bookmark-collection endpoint
 * requires an authenticated user.
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
 * COLLECTIONS
 * ==================================================
 *
 * These routes must appear before:
 *
 *   /:bookmarkId
 *
 * so "collections" is never interpreted as a
 * bookmarkId.
 */

/* GET all collections */
router.get("/collections", getBookmarkCollectionsController);

/* GET one collection */
router.get("/collections/:collectionId", getBookmarkCollectionController);

/* CREATE custom collection */
router.post("/collections", createBookmarkCollectionController);

/* UPDATE collection */
router.patch("/collections/:collectionId", updateBookmarkCollectionController);

/* DELETE custom collection */
router.delete("/collections/:collectionId", deleteBookmarkCollectionController);

/*
 * ==================================================
 * BOOKMARKS
 * ==================================================
 */

/* CREATE bookmark */
router.post("/", createBookmarkController);

/* GET bookmark */
router.get("/:bookmarkId", getBookmarkController);

/* UPDATE bookmark */
router.patch("/:bookmarkId", updateBookmarkController);

/* DELETE bookmark */
router.delete("/:bookmarkId", deleteBookmarkController);

export default router;

import type { Request, Response } from "express";

import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  updateBookmark,
} from "./bookmark.service.js";

import {
  createBookmarkCollection,
  deleteBookmarkCollection,
  getBookmarkCollection,
  getBookmarkCollections,
  updateBookmarkCollection,
} from "./bookmarkCollection.service.js";

/*
 * ==================================================
 * TYPES
 * ==================================================
 */

interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
}

/*
 * ==================================================
 * HELPERS
 * ==================================================
 */

/**
 * Authentication middleware attaches `auth` to the request
 * at runtime.
 *
 * The authenticate middleware stores:
 *
 * req.auth = {
 *   userId,
 *   role,
 *   sessionId,
 * }
 *
 * We keep the controller parameter as the normal Express
 * Request type so Express 5 route-handler typing remains
 * compatible.
 */
function getAuthenticatedUserId(req: Request): string {
  const authenticatedRequest = req as AuthenticatedRequest;

  if (!authenticatedRequest.auth) {
    throw new Error("Authenticated user not found");
  }

  return authenticatedRequest.auth.userId;
}

/**
 * Express 5 params can be typed as:
 *
 * string | string[] | undefined
 *
 * Normalize that into a single string before parsing.
 */
function getUuidParam(
  value: string | string[] | undefined,
  name: string,
): string {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (!normalizedValue) {
    throw new Error(`${name} is required`);
  }

  const parsed = normalizedValue.trim();

  if (parsed.length === 0) {
    throw new Error(`${name} must be a valid UUID`);
  }

  return parsed;
}

/*
 * ==================================================
 * BOOKMARK
 * ==================================================
 */

/**
 * GET /bookmarks/:bookmarkId
 */
export async function getBookmarkController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const bookmarkId = getUuidParam(req.params.bookmarkId, "bookmarkId");

  const bookmark = await getBookmark(userId, bookmarkId);

  res.status(200).json({
    success: true,
    data: bookmark,
  });
}

/**
 * POST /bookmarks
 */
export async function createBookmarkController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const bookmark = await createBookmark(userId, req.body);

  res.status(201).json({
    success: true,
    data: bookmark,
  });
}

/**
 * PATCH /bookmarks/:bookmarkId
 */
export async function updateBookmarkController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const bookmarkId = getUuidParam(req.params.bookmarkId, "bookmarkId");

  const bookmark = await updateBookmark(userId, bookmarkId, req.body);

  /*
   * null means the bookmark was successfully deleted
   * because:
   *
   *   starRating === 0
   *   AND
   *   collectionIds.length === 0
   *
   * Therefore this is a successful operation, not
   * "bookmark not found".
   */
  if (bookmark === null) {
    res.status(204).send();
    return;
  }

  res.status(200).json({
    success: true,
    data: bookmark,
  });
}

/**
 * DELETE /bookmarks/:bookmarkId
 */
export async function deleteBookmarkController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const bookmarkId = getUuidParam(req.params.bookmarkId, "bookmarkId");

  /*
   * deleteBookmark() returns void.
   *
   * If the bookmark does not exist or does not belong
   * to the user, the service is responsible for handling
   * that condition.
   */
  await deleteBookmark(userId, bookmarkId);

  res.status(204).send();
}

/*
 * ==================================================
 * BOOKMARK COLLECTIONS
 * ==================================================
 */

/**
 * GET /bookmarks/collections
 */
export async function getBookmarkCollectionsController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const collections = await getBookmarkCollections(userId);

  res.status(200).json({
    success: true,
    data: collections,
  });
}

/**
 * GET /bookmarks/collections/:collectionId
 */
export async function getBookmarkCollectionController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const collectionId = getUuidParam(req.params.collectionId, "collectionId");

  const collection = await getBookmarkCollection(userId, collectionId);

  if (!collection) {
    res.status(404).json({
      success: false,
      message: "Bookmark collection not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: collection,
  });
}

/**
 * POST /bookmarks/collections
 */
export async function createBookmarkCollectionController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const collection = await createBookmarkCollection(userId, req.body);

  res.status(201).json({
    success: true,
    data: collection,
  });
}

/**
 * PATCH /bookmarks/collections/:collectionId
 */
export async function updateBookmarkCollectionController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const collectionId = getUuidParam(req.params.collectionId, "collectionId");

  const collection = await updateBookmarkCollection(
    userId,
    collectionId,
    req.body,
  );

  if (!collection) {
    res.status(404).json({
      success: false,
      message: "Bookmark collection not found",
    });

    return;
  }

  res.status(200).json({
    success: true,
    data: collection,
  });
}

/**
 * DELETE /bookmarks/collections/:collectionId
 */
export async function deleteBookmarkCollectionController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req);

  const collectionId = getUuidParam(req.params.collectionId, "collectionId");

  /*
   * deleteBookmarkCollection() returns void.
   * Do not test its return value.
   */
  await deleteBookmarkCollection(userId, collectionId);

  res.status(204).send();
}

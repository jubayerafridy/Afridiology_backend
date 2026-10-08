import { prisma } from "../../../config/prisma.js";

import {
  DEFAULT_BOOKMARK_COLLECTIONS,
  BOOKMARK_COLLECTION_TYPES,
} from "./bookmark.constants.js";

import type {
  CreateBookmarkCollectionInput,
  UpdateBookmarkCollectionInput,
} from "./bookmark.types.js";

import {
  validateCreateBookmarkCollectionInput,
  validateUpdateBookmarkCollectionInput,
} from "./bookmark.validation.js";

/*
 * ==================================================
 * BOOKMARK COLLECTION SERVICE
 * ==================================================
 *
 * Responsible for:
 *
 * - default collection initialization
 * - reading collections
 * - creating custom collections
 * - updating collections
 * - deleting custom collections
 *
 * This service does NOT manage Bookmark rows.
 */

/* ==================================================
 * ERROR HELPER
 * ================================================== */

function createError(name: string, message: string): Error {
  const error = new Error(message);

  error.name = name;

  return error;
}

/* ==================================================
 * DEFAULT COLLECTION INITIALIZATION
 * ==================================================
 *
 * A student receives the four predefined collections
 * lazily when bookmark functionality is first used.
 *
 * We first perform a cheap existence check.
 *
 * The database unique constraint on:
 *
 *   (userId, defaultType)
 *
 * protects against duplicate default collections
 * when concurrent requests happen.
 */

export async function ensureDefaultBookmarkCollections(
  userId: string,
): Promise<void> {
  const existingCollection = await prisma.orm.public.BookmarkCollection.first({
    userId,
  });

  if (existingCollection) {
    return;
  }

  await Promise.all(
    DEFAULT_BOOKMARK_COLLECTIONS.map(async (collection) => {
      try {
        await prisma.orm.public.BookmarkCollection.create({
          userId,
          name: collection.name,
          color: collection.color,
          type: "DEFAULT",
          defaultType: collection.defaultType,
          sortOrder: collection.sortOrder,
        });
      } catch (error: unknown) {
        /*
         * Another concurrent request may have created
         * this exact default collection between the
         * existence check and create().
         *
         * Re-check before deciding that the operation
         * actually failed.
         */
        const collectionNowExists =
          await prisma.orm.public.BookmarkCollection.first({
            userId,
            defaultType: collection.defaultType,
          });

        if (!collectionNowExists) {
          throw error;
        }
      }
    }),
  );
}

/* ==================================================
 * GET USER COLLECTIONS
 * ================================================== */

export async function getBookmarkCollections(userId: string) {
  const collections = await prisma.orm.public.BookmarkCollection.where({
    userId,
  }).all();

  collections.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.id.localeCompare(b.id);
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    color: collection.color,
    type: collection.type,
    defaultType: collection.defaultType,
    sortOrder: collection.sortOrder,
  }));
}

/* ==================================================
 * GET ONE USER COLLECTION
 * ================================================== */

export async function getBookmarkCollection(
  userId: string,
  collectionId: string,
) {
  const collection = await prisma.orm.public.BookmarkCollection.first({
    id: collectionId,
    userId,
  });

  if (!collection) {
    throw createError("NOT_FOUND", "Bookmark collection not found");
  }

  return {
    id: collection.id,
    name: collection.name,
    color: collection.color,
    type: collection.type,
    defaultType: collection.defaultType,
    sortOrder: collection.sortOrder,
  };
}

/* ==================================================
 * CREATE CUSTOM COLLECTION
 * ================================================== */

export async function createBookmarkCollection(
  userId: string,
  input: CreateBookmarkCollectionInput,
) {
  const validated = validateCreateBookmarkCollectionInput(input);

  /*
   * Make sure the student's four standard collections
   * exist before creating a custom collection.
   */
  await ensureDefaultBookmarkCollections(userId);

  const collection = await prisma.orm.public.BookmarkCollection.create({
    userId,
    name: validated.name,
    color: validated.color,
    type: "CUSTOM",
    defaultType: null,
    sortOrder: 1000,
  });

  return {
    id: collection.id,
    name: collection.name,
    color: collection.color,
    type: collection.type,
    defaultType: collection.defaultType,
    sortOrder: collection.sortOrder,
  };
}

/* ==================================================
 * UPDATE COLLECTION
 * ==================================================
 *
 * Both DEFAULT and CUSTOM collections may have their
 * name, color, or sort order changed.
 *
 * The type/defaultType fields are never exposed here,
 * so a custom collection cannot be converted into a
 * default collection.
 */

export async function updateBookmarkCollection(
  userId: string,
  collectionId: string,
  input: UpdateBookmarkCollectionInput,
) {
  const validated = validateUpdateBookmarkCollectionInput(input);

  const existing = await prisma.orm.public.BookmarkCollection.first({
    id: collectionId,
    userId,
  });

  if (!existing) {
    throw createError("NOT_FOUND", "Bookmark collection not found");
  }

  await prisma.orm.public.BookmarkCollection.where({
    id: collectionId,
  }).update({
    ...(validated.name !== undefined ? { name: validated.name } : {}),

    ...(validated.color !== undefined ? { color: validated.color } : {}),

    ...(validated.sortOrder !== undefined
      ? { sortOrder: validated.sortOrder }
      : {}),
  });

  /*
   * Re-read the row after update.
   *
   * This gives us a guaranteed non-null result after
   * the update and matches the generated Contract API
   * used elsewhere in this backend.
   */
  const collection = await prisma.orm.public.BookmarkCollection.first({
    id: collectionId,
    userId,
  });

  if (!collection) {
    throw createError(
      "NOT_FOUND",
      "Bookmark collection not found after update",
    );
  }

  return {
    id: collection.id,
    name: collection.name,
    color: collection.color,
    type: collection.type,
    defaultType: collection.defaultType,
    sortOrder: collection.sortOrder,
  };
}

/* ==================================================
 * DELETE COLLECTION
 * ==================================================
 *
 * Default collections are permanent.
 *
 * Custom collections can be deleted.
 *
 * BookmarkCollectionItem has ON DELETE CASCADE, so
 * deleting a collection automatically removes its
 * membership rows.
 *
 * The actual Bookmark remains intact.
 */

export async function deleteBookmarkCollection(
  userId: string,
  collectionId: string,
): Promise<void> {
  const existing = await prisma.orm.public.BookmarkCollection.first({
    id: collectionId,
    userId,
  });

  if (!existing) {
    throw createError("NOT_FOUND", "Bookmark collection not found");
  }

  if (existing.type === BOOKMARK_COLLECTION_TYPES[0]) {
    throw createError(
      "BAD_REQUEST",
      "Default bookmark collections cannot be deleted",
    );
  }

  await prisma.orm.public.BookmarkCollection.where({
    id: collectionId,
  }).delete();
}

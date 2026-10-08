import { prisma } from "../../../config/prisma.js";

import type {
  BookmarkStateLookupTarget,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "./bookmark.types.js";

import { getBookmarkTargetKey } from "./bookmark.types.js";

import {
  validateCreateBookmarkInput,
  validateUpdateBookmarkInput,
} from "./bookmark.validation.js";

import { ensureDefaultBookmarkCollections } from "./bookmarkCollection.service.js";

/*
 * ==================================================
 * BOOKMARK SERVICE
 * ==================================================
 *
 * Responsible for the Bookmark entity and its
 * collection memberships.
 *
 * Architecture:
 *
 * User
 *   │
 *   ├── Bookmark
 *   │      └── BookmarkCollectionItem
 *   │               └── BookmarkCollection
 *
 * There is ONLY ONE Bookmark row for:
 *
 *   user + targetType + targetId
 *
 * Collections are memberships, not duplicate
 * bookmarks.
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
 * COLLECTION OWNERSHIP
 * ==================================================
 *
 * A user can only attach collections belonging to
 * that same user.
 */

async function validateUserCollections(
  userId: string,
  collectionIds: string[],
): Promise<void> {
  if (collectionIds.length === 0) {
    return;
  }

  const collections = await prisma.orm.public.BookmarkCollection.where({
    userId,
  }).all();

  const ownedIds = new Set(collections.map((collection) => collection.id));

  const invalidIds = collectionIds.filter((id) => !ownedIds.has(id));

  if (invalidIds.length > 0) {
    throw createError(
      "BAD_REQUEST",

      "One or more bookmark collections do not belong to the current user",
    );
  }
}

/* ==================================================
 * GET BOOKMARK
 * ================================================== */

export async function getBookmark(userId: string, bookmarkId: string) {
  const bookmark = await prisma.orm.public.Bookmark.first({
    id: bookmarkId,

    userId,
  });

  if (!bookmark) {
    throw createError("NOT_FOUND", "Bookmark not found");
  }

  const collectionItems = await prisma.orm.public.BookmarkCollectionItem.where({
    bookmarkId: bookmark.id,
  }).all();

  return {
    id: bookmark.id,

    targetType: bookmark.targetType,

    targetId: bookmark.targetId,

    starRating: bookmark.starRating,

    collectionIds: collectionItems.map((item) => item.collectionId),

    createdAt: bookmark.createdAt,

    updatedAt: bookmark.updatedAt,
  };
}

/* ==================================================
 * CREATE / UPSERT BOOKMARK
 * ==================================================
 *
 * Idempotent by:
 *
 *   user + targetType + targetId
 *
 * If that Bookmark already exists, its state is
 * updated instead of creating another Bookmark row.
 */

export async function createBookmark(
  userId: string,

  input: CreateBookmarkInput,
) {
  const validated = validateCreateBookmarkInput(input);

  /*

   * Lazy initialization.

   *

   * The first bookmark-related operation initializes

   * the four predefined collections if the user has

   * no collections yet.

   */

  await ensureDefaultBookmarkCollections(userId);

  const collectionIds = validated.collectionIds ?? [];

  await validateUserCollections(userId, collectionIds);

  const requestedStarRating = validated.starRating ?? 0;

  const existing = await prisma.orm.public.Bookmark.first({
    userId,

    targetType: validated.targetType,

    targetId: validated.targetId,
  });

  if (existing) {
    return updateExistingBookmark(userId, existing.id, {
      starRating: requestedStarRating,

      collectionIds,
    });
  }

  const bookmark = await prisma.orm.public.Bookmark.create({
    userId,

    targetType: validated.targetType,

    targetId: validated.targetId,

    starRating: requestedStarRating,
  });

  /*

   * Add requested collection memberships.

   */

  for (const collectionId of collectionIds) {
    await prisma.orm.public.BookmarkCollectionItem.create({
      bookmarkId: bookmark.id,

      collectionId,
    });
  }

  return {
    id: bookmark.id,

    targetType: bookmark.targetType,

    targetId: bookmark.targetId,

    starRating: bookmark.starRating,

    collectionIds,

    createdAt: bookmark.createdAt,

    updatedAt: bookmark.updatedAt,
  };
}

/* ==================================================
 * UPDATE BOOKMARK
 * ================================================== */

export async function updateBookmark(
  userId: string,

  bookmarkId: string,

  input: UpdateBookmarkInput,
) {
  const validated = validateUpdateBookmarkInput(input);

  const existing = await prisma.orm.public.Bookmark.first({
    id: bookmarkId,

    userId,
  });

  if (!existing) {
    throw createError("NOT_FOUND", "Bookmark not found");
  }

  if (validated.collectionIds !== undefined) {
    await validateUserCollections(userId, validated.collectionIds);
  }

  return updateExistingBookmark(userId, bookmarkId, validated);
}

/* ==================================================
 * UPDATE EXISTING BOOKMARK
 * ================================================== */

async function updateExistingBookmark(
  userId: string,

  bookmarkId: string,

  input: UpdateBookmarkInput,
) {
  const existing = await prisma.orm.public.Bookmark.first({
    id: bookmarkId,

    userId,
  });

  if (!existing) {
    throw createError("NOT_FOUND", "Bookmark not found");
  }

  /*

   * Update star rating if supplied.

   *

   * The Contract API is:

   *

   *   Bookmark.where({ id }).update(...)

   */

  if (input.starRating !== undefined) {
    await prisma.orm.public.Bookmark.where({
      id: bookmarkId,
    }).update({
      starRating: input.starRating,
    });
  }

  /*

   * Update collection memberships only when

   * collectionIds was explicitly supplied.

   *

   * collectionIds represents the COMPLETE desired

   * membership set.

   */

  if (input.collectionIds !== undefined) {
    const currentItems = await prisma.orm.public.BookmarkCollectionItem.where({
      bookmarkId,
    }).all();

    const desiredIds = new Set(input.collectionIds);

    const currentIds = new Set(currentItems.map((item) => item.collectionId));

    /*

     * Remove memberships that are no longer desired.

     */

    for (const item of currentItems) {
      if (!desiredIds.has(item.collectionId)) {
        await prisma.orm.public.BookmarkCollectionItem.where({
          id: item.id,
        }).delete();
      }
    }

    /*

     * Add newly requested memberships.

     */

    for (const collectionId of input.collectionIds) {
      if (!currentIds.has(collectionId)) {
        await prisma.orm.public.BookmarkCollectionItem.create({
          bookmarkId,

          collectionId,
        });
      }
    }
  }

  /*

   * Re-read the Bookmark after all mutations.

   */

  const bookmark = await prisma.orm.public.Bookmark.first({
    id: bookmarkId,

    userId,
  });

  if (!bookmark) {
    throw createError("NOT_FOUND", "Bookmark disappeared during update");
  }

  /*

   * Refresh membership list.

   */

  const collectionItems = await prisma.orm.public.BookmarkCollectionItem.where({
    bookmarkId,
  }).all();

  const collectionIds = collectionItems.map((item) => item.collectionId);

  /*

   * Important cleanup rule:

   *

   * starRating === 0

   * AND

   * no collection memberships

   *

   * => delete Bookmark completely.

   */

  if (bookmark.starRating === 0 && collectionIds.length === 0) {
    await prisma.orm.public.Bookmark.where({
      id: bookmarkId,
    }).delete();

    return null;
  }

  return {
    id: bookmark.id,

    targetType: bookmark.targetType,

    targetId: bookmark.targetId,

    starRating: bookmark.starRating,

    collectionIds,

    createdAt: bookmark.createdAt,

    updatedAt: bookmark.updatedAt,
  };
}

/* ==================================================
 * DELETE BOOKMARK
 * ==================================================
 *
 * Deletes the entire Bookmark.
 *
 * BookmarkCollectionItem rows are automatically
 * removed by the database because the relation uses
 * ON DELETE CASCADE.
 */

export async function deleteBookmark(
  userId: string,

  bookmarkId: string,
): Promise<void> {
  const existing = await prisma.orm.public.Bookmark.first({
    id: bookmarkId,

    userId,
  });

  if (!existing) {
    throw createError("NOT_FOUND", "Bookmark not found");
  }

  await prisma.orm.public.Bookmark.where({
    id: bookmarkId,
  }).delete();
}

/* ==================================================
 * GET BOOKMARK STATES FOR TARGETS
 * ==================================================
 *
 * Shared internal service used later by:
 *
 * - Knowledge Graph
 * - Question Bank
 * - other student content endpoints
 *
 * The caller supplies all targets already present
 * in its response.
 *
 * Example:
 *
 * [
 *   { targetType: "CONCEPT", targetId: 12 },
 *   { targetType: "EXECUTION", targetId: 48 },
 *   { targetType: "CQ", targetId: 381 }
 * ]
 *
 * Result:
 *
 * Map<
 *   "CQ:381",
 *   {
 *     bookmarked: true,
 *     bookmarkId: 91,
 *     starRating: 4,
 *     collectionIds: [1, 3]
 *   }
 * >
 *
 * IMPORTANT:
 *
 * This method intentionally does NOT scan:
 *
 * - every Bookmark belonging to the user
 * - every BookmarkCollectionItem in the database
 *
 * Instead, it queries only the requested targets.
 *
 * This is important because Knowledge Graph requests
 * can happen frequently and may contain many nodes.
 */

export async function getBookmarkStates(
  userId: string,

  targets: BookmarkStateLookupTarget[],
) {
  /*

   * --------------------------------------------------

   * STEP 1

   * Deduplicate and validate requested targets.

   * --------------------------------------------------

   */

  const uniqueTargets = new Map<string, BookmarkStateLookupTarget>();

  for (const target of targets) {
    if (
      typeof target.targetId !== "string" ||
      target.targetId.trim().length === 0
    ) {
      continue;
    }

    const key = getBookmarkTargetKey(target.targetType, target.targetId);

    uniqueTargets.set(key, target);
  }

  if (uniqueTargets.size === 0) {
    return new Map();
  }

  /*

   * --------------------------------------------------

   * STEP 2

   * Find ONLY the requested bookmarks.

   *

   * Previously this method did:

   *

   *   Bookmark.where({ userId }).all()

   *

   * which loaded every bookmark belonging to the

   * student and then filtered in memory.

   *

   * That becomes increasingly expensive as a student

   * accumulates bookmarks.

   *

   * Now every query is scoped by:

   *

   *   userId

   *   targetType

   *   targetId

   *

   * which matches the unique database constraint:

   *

   *   (userId, targetType, targetId)

   * --------------------------------------------------

   */

  const targetList = Array.from(uniqueTargets.values());

  const bookmarkResults = await Promise.all(
    targetList.map((target) =>
      prisma.orm.public.Bookmark.first({
        userId,

        targetType: target.targetType,

        targetId: target.targetId,
      }),
    ),
  );

  /*

   * Keep only bookmarks that actually exist.

   */

  const relevantBookmarks = bookmarkResults.filter(
    (bookmark): bookmark is NonNullable<typeof bookmark> =>
      bookmark !== null && bookmark !== undefined,
  );

  if (relevantBookmarks.length === 0) {
    return new Map();
  }

  /*

   * --------------------------------------------------

   * STEP 3

   * Fetch collection memberships ONLY for the

   * bookmarks found above.

   *

   * We deliberately do not call:

   *

   *   BookmarkCollectionItem.all()

   *

   * because that would scan the entire membership

   * table across every user.

   *

   * Each query below is scoped to one known bookmark.

   * --------------------------------------------------

   */

  const membershipResults = await Promise.all(
    relevantBookmarks.map(async (bookmark) => {
      const collectionItems =
        await prisma.orm.public.BookmarkCollectionItem.where({
          bookmarkId: bookmark.id,
        }).all();

      return {
        bookmarkId: bookmark.id,

        collectionIds: collectionItems.map((item) => item.collectionId),
      };
    }),
  );

  /*

   * Convert membership results into:

   *

   * bookmarkId -> collectionIds[]

   */

  const collectionMap = new Map<string, string[]>();

  for (const membership of membershipResults) {
    collectionMap.set(membership.bookmarkId, membership.collectionIds);
  }

  /*

   * --------------------------------------------------

   * STEP 4

   * Build the final target-keyed state map.

   * --------------------------------------------------

   */

  const result = new Map<
    string,
    {
      bookmarked: true;

      bookmarkId: string;

      starRating: number;

      collectionIds: string[];
    }
  >();

  for (const bookmark of relevantBookmarks) {
    const targetType =
      bookmark.targetType as BookmarkStateLookupTarget["targetType"];

    const key = getBookmarkTargetKey(targetType, bookmark.targetId);

    result.set(key, {
      bookmarked: true,

      bookmarkId: bookmark.id,

      starRating: bookmark.starRating,

      collectionIds: collectionMap.get(bookmark.id) ?? [],
    });
  }

  return result;
}

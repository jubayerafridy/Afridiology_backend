import type {
  BookmarkCollectionType,
  BookmarkDefaultType,
  BookmarkTargetType,
} from "./bookmark.constants.js";

/*
 * ==================================================
 * BOOKMARK TYPES
 * ==================================================
 *
 * Application-level types for the bookmark system.
 *
 * These are deliberately independent from Prisma
 * generated types so the API/service layer does not
 * become tightly coupled to database representation.
 */

/* ==================================================
 * BOOKMARK TARGET
 * ================================================== */

export interface BookmarkTarget {
  targetType: BookmarkTargetType;
  targetId: number;
}

/* ==================================================
 * BOOKMARK STATE
 * ==================================================
 *
 * This is the compact bookmark information that can
 * travel with Knowledge Graph / Question Bank data.
 */

export interface BookmarkState {
  bookmarked: boolean;

  bookmarkId: number;

  starRating: number;

  collectionIds: number[];
}

/* ==================================================
 * BOOKMARK COLLECTION
 * ================================================== */

export interface BookmarkCollectionData {
  id: number;

  name: string;

  color: string;

  type: BookmarkCollectionType;

  defaultType: BookmarkDefaultType | null;

  sortOrder: number;
}

/* ==================================================
 * CREATE BOOKMARK
 * ================================================== */

export interface CreateBookmarkInput {
  targetType: BookmarkTargetType;

  targetId: number;

  starRating?: number;

  collectionIds?: number[];
}

/* ==================================================
 * UPDATE BOOKMARK
 * ==================================================
 *
 * Every field is optional.
 *
 * Important:
 *
 * - starRating belongs to Bookmark itself.
 * - collectionIds represents the desired collection
 *   memberships.
 *
 * We will implement the exact mutation semantics in
 * bookmark.service.ts.
 */

export interface UpdateBookmarkInput {
  starRating?: number;

  collectionIds?: number[];
}

/* ==================================================
 * CREATE COLLECTION
 * ================================================== */

export interface CreateBookmarkCollectionInput {
  name: string;

  color: string;
}

/* ==================================================
 * UPDATE COLLECTION
 * ================================================== */

export interface UpdateBookmarkCollectionInput {
  name?: string;

  color?: string;

  sortOrder?: number;
}

/* ==================================================
 * BOOKMARK STATE LOOKUP
 * ==================================================
 *
 * Used internally by Knowledge Graph and Question
 * Bank later.
 */

export interface BookmarkStateLookupTarget {
  targetType: BookmarkTargetType;

  targetId: number;
}

export type BookmarkStateMap = Map<string, BookmarkState>;

/* ==================================================
 * HELPER KEY
 * ==================================================
 */

export function getBookmarkTargetKey(
  targetType: BookmarkTargetType,
  targetId: number,
): string {
  return `${targetType}:${targetId}`;
}

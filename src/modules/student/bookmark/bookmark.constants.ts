/*
 * ==================================================
 * BOOKMARK CONSTANTS
 * ==================================================
 *
 * Shared constants for the student bookmark system.
 *
 * This file contains no database logic.
 * It is safe to import from services, controllers,
 * validation, and future bookmark consumers.
 */

/* ==================================================
 * TARGET TYPES
 * ================================================== */

/**
 * Content types that can be bookmarked.
 *
 * CHAPTER and LESSON are supported by the database
 * even though the current UI primarily focuses on:
 *
 * CONCEPT
 * EXECUTION
 * CQ
 * MCQ
 */
export const BOOKMARK_TARGET_TYPES = [
  "CHAPTER",
  "LESSON",
  "CONCEPT",
  "EXECUTION",
  "CQ",
  "MCQ",
] as const;

export type BookmarkTargetType = (typeof BOOKMARK_TARGET_TYPES)[number];

/* ==================================================
 * COLLECTION TYPES
 * ================================================== */

export const BOOKMARK_COLLECTION_TYPES = ["DEFAULT", "CUSTOM"] as const;

export type BookmarkCollectionType = (typeof BOOKMARK_COLLECTION_TYPES)[number];

/* ==================================================
 * DEFAULT COLLECTION TYPES
 * ================================================== */

export const BOOKMARK_DEFAULT_TYPES = [
  "HARD",
  "REVISION",
  "IMPORTANT",
  "NEED_PRACTICE",
] as const;

export type BookmarkDefaultType = (typeof BOOKMARK_DEFAULT_TYPES)[number];

/* ==================================================
 * DEFAULT COLLECTION CONFIGURATION
 * ==================================================
 *
 * These are the four collections automatically
 * available to a student.
 *
 * Colors are initial defaults only.
 * Students may change the color later.
 */

export const DEFAULT_BOOKMARK_COLLECTIONS = [
  {
    defaultType: "HARD",
    name: "Hard",
    color: "#EF4444",
    sortOrder: 0,
  },
  {
    defaultType: "REVISION",
    name: "Revision",
    color: "#3B82F6",
    sortOrder: 1,
  },
  {
    defaultType: "IMPORTANT",
    name: "Important",
    color: "#F59E0B",
    sortOrder: 2,
  },
  {
    defaultType: "NEED_PRACTICE",
    name: "Need Practice",
    color: "#8B5CF6",
    sortOrder: 3,
  },
] as const;

/* ==================================================
 * STAR RATING
 * ================================================== */

export const MIN_BOOKMARK_STAR_RATING = 0;

export const MAX_BOOKMARK_STAR_RATING = 5;

/* ==================================================
 * CUSTOM COLLECTION
 * ================================================== */

export const MIN_BOOKMARK_COLLECTION_NAME_LENGTH = 1;

export const MAX_BOOKMARK_COLLECTION_NAME_LENGTH = 100;

/**
 * Basic hexadecimal color validation is handled in
 * validation.ts.
 *
 * The length limit here prevents unnecessarily large
 * values from entering the database.
 */
export const MAX_BOOKMARK_COLLECTION_COLOR_LENGTH = 20;

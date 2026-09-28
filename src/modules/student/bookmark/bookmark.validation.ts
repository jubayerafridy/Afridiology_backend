import {
  BOOKMARK_DEFAULT_TYPES,
  BOOKMARK_TARGET_TYPES,
  MAX_BOOKMARK_COLLECTION_COLOR_LENGTH,
  MAX_BOOKMARK_COLLECTION_NAME_LENGTH,
  MAX_BOOKMARK_STAR_RATING,
  MIN_BOOKMARK_COLLECTION_NAME_LENGTH,
  MIN_BOOKMARK_STAR_RATING,
} from "./bookmark.constants.js";

import type {
  CreateBookmarkCollectionInput,
  CreateBookmarkInput,
  UpdateBookmarkCollectionInput,
  UpdateBookmarkInput,
} from "./bookmark.types.js";

/*
 * ==================================================
 * BOOKMARK VALIDATION
 * ==================================================
 *
 * Pure validation functions only.
 *
 * No Prisma calls.
 * No Express logic.
 * No authentication logic.
 */

/* ==================================================
 * ERROR
 * ================================================== */

function badRequest(message: string): never {
  const error = new Error(message);

  error.name = "BAD_REQUEST";

  throw error;
}

/* ==================================================
 * POSITIVE INTEGER
 * ================================================== */

export function validatePositiveInteger(
  value: unknown,
  fieldName: string,
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    badRequest(`${fieldName} must be a positive integer`);
  }

  return value;
}

/* ==================================================
 * TARGET TYPE
 * ================================================== */

export function validateBookmarkTargetType(
  value: unknown,
): (typeof BOOKMARK_TARGET_TYPES)[number] {
  if (
    typeof value !== "string" ||
    !BOOKMARK_TARGET_TYPES.includes(
      value as (typeof BOOKMARK_TARGET_TYPES)[number],
    )
  ) {
    badRequest(
      `targetType must be one of: ${BOOKMARK_TARGET_TYPES.join(", ")}`,
    );
  }

  return value as (typeof BOOKMARK_TARGET_TYPES)[number];
}

/* ==================================================
 * STAR RATING
 * ================================================== */

export function validateBookmarkStarRating(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < MIN_BOOKMARK_STAR_RATING ||
    value > MAX_BOOKMARK_STAR_RATING
  ) {
    badRequest(
      `starRating must be an integer between ${MIN_BOOKMARK_STAR_RATING} and ${MAX_BOOKMARK_STAR_RATING}`,
    );
  }

  return value;
}

/* ==================================================
 * COLLECTION ID LIST
 * ================================================== */

export function validateCollectionIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    badRequest("collectionIds must be an array");
  }

  const ids = value as unknown[];

  const normalized = ids.map((id, index) =>
    validatePositiveInteger(id, `collectionIds[${index}]`),
  );

  const uniqueIds = [...new Set(normalized)];

  if (uniqueIds.length !== normalized.length) {
    badRequest("collectionIds must not contain duplicates");
  }

  return uniqueIds;
}

/* ==================================================
 * DEFAULT TYPE
 * ================================================== */

export function validateBookmarkDefaultType(
  value: unknown,
): (typeof BOOKMARK_DEFAULT_TYPES)[number] {
  if (
    typeof value !== "string" ||
    !BOOKMARK_DEFAULT_TYPES.includes(
      value as (typeof BOOKMARK_DEFAULT_TYPES)[number],
    )
  ) {
    badRequest(
      `defaultType must be one of: ${BOOKMARK_DEFAULT_TYPES.join(", ")}`,
    );
  }

  return value as (typeof BOOKMARK_DEFAULT_TYPES)[number];
}

/* ==================================================
 * COLLECTION NAME
 * ================================================== */

export function validateCollectionName(value: unknown): string {
  if (typeof value !== "string") {
    badRequest("Collection name must be a string");
  }

  const name = value.trim();

  if (
    name.length < MIN_BOOKMARK_COLLECTION_NAME_LENGTH ||
    name.length > MAX_BOOKMARK_COLLECTION_NAME_LENGTH
  ) {
    badRequest(
      `Collection name must be between ${MIN_BOOKMARK_COLLECTION_NAME_LENGTH} and ${MAX_BOOKMARK_COLLECTION_NAME_LENGTH} characters`,
    );
  }

  return name;
}

/* ==================================================
 * COLLECTION COLOR
 * ================================================== */

export function validateCollectionColor(value: unknown): string {
  if (typeof value !== "string") {
    badRequest("Collection color must be a string");
  }

  const color = value.trim();

  if (color.length === 0) {
    badRequest("Collection color is required");
  }

  if (color.length > MAX_BOOKMARK_COLLECTION_COLOR_LENGTH) {
    badRequest(
      `Collection color must not exceed ${MAX_BOOKMARK_COLLECTION_COLOR_LENGTH} characters`,
    );
  }

  /*
   * Accept standard hexadecimal colors:
   *
   * #RGB
   * #RRGGBB
   * #RGBA
   * #RRGGBBAA
   */
  const hexColorPattern =
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

  if (!hexColorPattern.test(color)) {
    badRequest("Collection color must be a valid hexadecimal color");
  }

  return color;
}

/* ==================================================
 * CREATE BOOKMARK
 * ================================================== */

export function validateCreateBookmarkInput(
  input: CreateBookmarkInput,
): CreateBookmarkInput {
  validateBookmarkTargetType(input.targetType);

  validatePositiveInteger(input.targetId, "targetId");

  if (input.starRating !== undefined) {
    validateBookmarkStarRating(input.starRating);
  }

  if (input.collectionIds !== undefined) {
    validateCollectionIds(input.collectionIds);
  }

  return input;
}

/* ==================================================
 * UPDATE BOOKMARK
 * ================================================== */

export function validateUpdateBookmarkInput(
  input: UpdateBookmarkInput,
): UpdateBookmarkInput {
  if (input.starRating === undefined && input.collectionIds === undefined) {
    badRequest("At least one bookmark field must be provided");
  }

  if (input.starRating !== undefined) {
    validateBookmarkStarRating(input.starRating);
  }

  if (input.collectionIds !== undefined) {
    validateCollectionIds(input.collectionIds);
  }

  return input;
}

/* ==================================================
 * CREATE COLLECTION
 * ================================================== */

export function validateCreateBookmarkCollectionInput(
  input: CreateBookmarkCollectionInput,
): CreateBookmarkCollectionInput {
  return {
    name: validateCollectionName(input.name),

    color: validateCollectionColor(input.color),
  };
}

/* ==================================================
 * UPDATE COLLECTION
 * ================================================== */

export function validateUpdateBookmarkCollectionInput(
  input: UpdateBookmarkCollectionInput,
): UpdateBookmarkCollectionInput {
  if (
    input.name === undefined &&
    input.color === undefined &&
    input.sortOrder === undefined
  ) {
    badRequest("At least one collection field must be provided");
  }

  const result: UpdateBookmarkCollectionInput = {};

  if (input.name !== undefined) {
    result.name = validateCollectionName(input.name);
  }

  if (input.color !== undefined) {
    result.color = validateCollectionColor(input.color);
  }

  if (input.sortOrder !== undefined) {
    if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
      badRequest("sortOrder must be a non-negative integer");
    }

    result.sortOrder = input.sortOrder;
  }

  return result;
}

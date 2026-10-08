import { prisma } from "../../../config/prisma.js";

import {
  appendLessonToChapterStructure,
  removeLessonFromChapterStructure,
} from "../chapter/chapter.service.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * ================================================================
 * LESSON DOCUMENT
 * ================================================================
 *
 * Lesson.descriptionBN / descriptionEng are the complete ordered
 * documents for the Lesson.
 *
 * Example:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "..."
 *   },
 *   {
 *     "type": "concept",
 *     "conceptID": "uuid"
 *   },
 *   {
 *     "type": "heading",
 *     "content": "..."
 *   },
 *   {
 *     "type": "text",
 *     "content": "..."
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - Content blocks do NOT have an id.
 * - Array position determines order.
 * - conceptID identifies the actual Concept table row.
 * - No structure field is used.
 * - No flow field is used.
 *
 * The same architecture will later be used for:
 *
 * Chapter  -> Lesson
 * Lesson   -> Concept
 * Concept  -> Execution
 *
 * CQs / MCQs are independent question records.
 * They are not hierarchy children.
 * ================================================================
 */

export interface LessonDocumentItem {
  type: string;
  [key: string]: JsonValue;
}

export type LessonDocument = LessonDocumentItem[];

/**
 * Backward-compatible type name.
 *
 * Existing callers may still import LessonStructure.
 * Internally it now means the ordered Lesson document.
 */
export type LessonStructure = LessonDocument;

/**
 * ================================================================
 * INPUT TYPES
 * ================================================================
 */

export interface CreateLessonInput {
  chapterId: string;
  lessonNo?: string | null;
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

export interface UpdateLessonInput {
  lessonNo?: string | null;
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

/**
 * ================================================================
 * INTERNAL HELPERS
 * ================================================================
 */

/**
 * Safely converts a database JSON value into an ordered
 * Lesson document.
 *
 * No block id is required.
 *
 * Valid examples:
 *
 * {
 *   type: "text",
 *   content: "Hello"
 * }
 *
 * {
 *   type: "concept",
 *   conceptID: "uuid"
 * }
 */
function normalizeLessonDocument(value: unknown): LessonDocument {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: LessonDocument = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }

    const candidate = item as {
      type?: unknown;
      [key: string]: unknown;
    };

    if (
      typeof candidate.type !== "string" ||
      candidate.type.trim().length === 0
    ) {
      continue;
    }

    normalized.push(candidate as LessonDocumentItem);
  }

  return normalized;
}

/**
 * ================================================================
 * CONCEPT REFERENCE HELPERS
 * ================================================================
 */

/**
 * Safely extracts a string Concept ID from a document item.
 *
 * Only items with:
 *
 * {
 *   type: "concept",
 *   conceptID: string
 * }
 *
 * are treated as Concept references.
 */
function getConceptId(item: LessonDocumentItem): string | null {
  if (item.type !== "concept") {
    return null;
  }

  const conceptId = item.conceptID;

  if (typeof conceptId !== "string" || conceptId.trim().length === 0) {
    return null;
  }

  return conceptId;
}

/**
 * ================================================================
 * CREATE LESSON
 * ================================================================
 *
 * 1. Verify parent Chapter.
 * 2. Verify Lesson serial uniqueness.
 * 3. Create Lesson.
 * 4. Get generated Lesson ID.
 * 5. Add Lesson reference to Chapter.descriptionBN.
 * 6. Add Lesson reference to Chapter.descriptionEng.
 *
 * Example Chapter document item:
 *
 * {
 *   "type": "lesson",
 *   "lessonID": "uuid"
 * }
 *
 * No block id is generated.
 * ================================================================
 */

export async function createLesson(data: CreateLessonInput) {
  /**
   * --------------------------------------------------
   * Verify parent Chapter
   * --------------------------------------------------
   */

  const chapter = await prisma.orm.public.Chapter.first({
    id: data.chapterId,
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  /**
   * --------------------------------------------------
   * Verify Lesson serial uniqueness
   * --------------------------------------------------
   */

  const lessonNo =
    typeof data.lessonNo === "string" && data.lessonNo.trim().length > 0
      ? data.lessonNo.trim()
      : null;

  if (lessonNo !== null) {
    const existingLesson = await prisma.orm.public.Lesson.first({
      chapterId: data.chapterId,
      lessonNo,
    });

    if (existingLesson) {
      throw new Error(
        "A lesson with this serial number already exists for this chapter",
      );
    }
  }

  /**
   * --------------------------------------------------
   * Normalize Lesson documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeLessonDocument(data.descriptionBN);

  const descriptionEng = normalizeLessonDocument(data.descriptionEng);

  /**
   * --------------------------------------------------
   * Create Lesson
   * --------------------------------------------------
   */

  const lesson = await prisma.orm.public.Lesson.create({
    chapterId: data.chapterId,
    lessonNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN,
    descriptionEng,
  });

  /**
   * --------------------------------------------------
   * Add Lesson reference to parent Chapter
   * --------------------------------------------------
   *
   * The Lesson ID is now known because it was generated
   * by the database.
   *
   * The Chapter service writes:
   *
   * {
   *   type: "lesson",
   *   lessonID: lesson.id
   * }
   *
   * to both descriptionBN and descriptionEng.
   */

  try {
    await appendLessonToChapterStructure(data.chapterId, lesson.id);
  } catch (error) {
    /**
     * The Lesson was created successfully, but the parent
     * Chapter document could not be updated.
     *
     * Attempt to remove the newly-created Lesson so we do
     * not leave an orphan Lesson.
     */

    try {
      await prisma.orm.public.Lesson.where({
        id: lesson.id,
      }).delete();
    } catch {
      /**
       * Preserve the original document-update error.
       */
    }

    throw error;
  }

  return lesson;
}

/**
 * ================================================================
 * GET LESSONS
 * ================================================================
 *
 * Used for normal CRUD/listing operations.
 *
 * NOTE:
 * Database ID ordering is only used here for ordinary listing.
 *
 * It does NOT determine the Lesson's position inside the
 * Chapter document.
 *
 * Chapter.descriptionBN / descriptionEng determine the
 * document order.
 * ================================================================
 */

export async function getLessons(chapterId?: string) {
  if (chapterId !== undefined) {
    return prisma.orm.public.Lesson.where({
      chapterId,
    })
      .orderBy((lesson) => lesson.id.asc())
      .all();
  }

  return prisma.orm.public.Lesson.orderBy((lesson) => lesson.id.asc()).all();
}

/**
 * ================================================================
 * GET SINGLE LESSON
 * ================================================================
 */

export async function getLesson(id: string) {
  return prisma.orm.public.Lesson.first({
    id,
  });
}

/**
 * ================================================================
 * UPDATE LESSON
 * ================================================================
 *
 * Updating Lesson metadata or its own document does NOT change
 * the Lesson reference inside the parent Chapter.
 *
 * The Chapter stores only:
 *
 * {
 *   type: "lesson",
 *   lessonID: "uuid"
 * }
 *
 * Therefore changing:
 *
 * - lessonNo
 * - nameBN
 * - nameEng
 * - descriptionBN
 * - descriptionEng
 *
 * does not affect the Chapter hierarchy reference.
 *
 * The Lesson's own description arrays are replaced with the
 * supplied ordered documents.
 * ================================================================
 */

export async function updateLesson(id: string, data: UpdateLessonInput) {
  /**
   * --------------------------------------------------
   * Find existing Lesson
   * --------------------------------------------------
   */

  const lesson = await prisma.orm.public.Lesson.first({
    id,
  });

  if (!lesson) {
    return null;
  }

  /**
   * --------------------------------------------------
   * Verify Lesson serial uniqueness
   * --------------------------------------------------
   *
   * The serial only needs to be unique within the
   * current Chapter.
   */

  const lessonNo =
    typeof data.lessonNo === "string" && data.lessonNo.trim().length > 0
      ? data.lessonNo.trim()
      : null;

  if (lessonNo !== null) {
    const duplicate = await prisma.orm.public.Lesson.where({
      chapterId: lesson.chapterId,
      lessonNo,
    }).first();

    if (duplicate && duplicate.id !== id) {
      throw new Error(
        "A lesson with this serial number already exists for this chapter",
      );
    }
  }

  /**
   * --------------------------------------------------
   * Normalize documents
   * --------------------------------------------------
   */

  const descriptionBN = normalizeLessonDocument(data.descriptionBN);

  const descriptionEng = normalizeLessonDocument(data.descriptionEng);

  /**
   * --------------------------------------------------
   * Update Lesson
   * --------------------------------------------------
   */

  return prisma.orm.public.Lesson.where({
    id,
  }).update({
    lessonNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * SET COMPLETE LESSON DOCUMENT
 * ================================================================
 *
 * Kept under the existing function name so existing callers
 * do not need to be changed immediately.
 *
 * The function now updates:
 *
 * descriptionBN
 * descriptionEng
 *
 * instead of a structure column.
 *
 * If English is omitted, the existing English document is
 * preserved.
 * ================================================================
 */

export async function setLessonStructure(
  lessonId: string,
  descriptionBN: LessonDocument,
  descriptionEng?: LessonDocument,
) {
  const lesson = await prisma.orm.public.Lesson.first({
    id: lessonId,
  });

  if (!lesson) {
    return null;
  }

  const normalizedBN = normalizeLessonDocument(descriptionBN);

  /**
   * If English is not supplied, preserve the existing
   * English document instead of accidentally deleting it.
   */

  const normalizedEng =
    descriptionEng !== undefined
      ? normalizeLessonDocument(descriptionEng)
      : normalizeLessonDocument(lesson.descriptionEng);

  return prisma.orm.public.Lesson.where({
    id: lessonId,
  }).update({
    descriptionBN: normalizedBN,
    descriptionEng: normalizedEng,
  });
}

/**
 * ================================================================
 * APPEND CONCEPT REFERENCE
 * ================================================================
 *
 * This helper will be used by concept.service.ts after a
 * Concept is created.
 *
 * Example:
 *
 * {
 *   "type": "concept",
 *   "conceptID": "uuid"
 * }
 *
 * is appended to BOTH:
 *
 * Lesson.descriptionBN
 * Lesson.descriptionEng
 *
 * No block id is generated.
 *
 * The Concept service remains responsible for creating the
 * actual Concept row.
 * ================================================================
 */

export async function appendConceptToLessonStructure(
  lessonId: string,
  conceptId: string,
) {
  const lesson = await prisma.orm.public.Lesson.first({
    id: lessonId,
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  /**
   * Verify that the Concept actually belongs to this Lesson.
   */

  const concept = await prisma.orm.public.Concept.first({
    id: conceptId,
  });

  if (!concept) {
    throw new Error("Concept not found");
  }

  if (concept.lessonId !== lessonId) {
    throw new Error("Concept does not belong to this Lesson");
  }

  const descriptionBN = normalizeLessonDocument(lesson.descriptionBN);

  const descriptionEng = normalizeLessonDocument(lesson.descriptionEng);

  /**
   * Prevent duplicate Concept references.
   */

  const bnAlreadyExists = descriptionBN.some(
    (item) => getConceptId(item) === conceptId,
  );

  const engAlreadyExists = descriptionEng.some(
    (item) => getConceptId(item) === conceptId,
  );

  /**
   * If both language documents already contain the
   * reference, there is nothing to do.
   */

  if (bnAlreadyExists && engAlreadyExists) {
    return lesson;
  }

  /**
   * Keep BN and English documents synchronized.
   *
   * The new Concept is appended to the end of each
   * language document.
   */

  if (!bnAlreadyExists) {
    descriptionBN.push({
      type: "concept",
      conceptID: conceptId,
    });
  }

  if (!engAlreadyExists) {
    descriptionEng.push({
      type: "concept",
      conceptID: conceptId,
    });
  }

  return prisma.orm.public.Lesson.where({
    id: lessonId,
  }).update({
    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * REMOVE CONCEPT REFERENCE
 * ================================================================
 *
 * Called when a Concept is deleted.
 *
 * Removes:
 *
 * {
 *   "type": "concept",
 *   "conceptID": conceptId
 * }
 *
 * from BOTH:
 *
 * Lesson.descriptionBN
 * Lesson.descriptionEng
 *
 * All other content remains untouched.
 *
 * Array order of the remaining items is preserved.
 * ================================================================
 */

export async function removeConceptFromLessonStructure(
  lessonId: string,
  conceptId: string,
) {
  const lesson = await prisma.orm.public.Lesson.first({
    id: lessonId,
  });

  if (!lesson) {
    return null;
  }

  const descriptionBN = normalizeLessonDocument(lesson.descriptionBN);

  const descriptionEng = normalizeLessonDocument(lesson.descriptionEng);

  const nextDescriptionBN = descriptionBN.filter(
    (item) => getConceptId(item) !== conceptId,
  );

  const nextDescriptionEng = descriptionEng.filter(
    (item) => getConceptId(item) !== conceptId,
  );

  /**
   * Nothing changed.
   */

  if (
    nextDescriptionBN.length === descriptionBN.length &&
    nextDescriptionEng.length === descriptionEng.length
  ) {
    return lesson;
  }

  return prisma.orm.public.Lesson.where({
    id: lessonId,
  }).update({
    descriptionBN: nextDescriptionBN,
    descriptionEng: nextDescriptionEng,
  });
}

/**
 * ================================================================
 * DELETE LESSON
 * ================================================================
 *
 * 1. Find Lesson so we know its parent Chapter.
 * 2. Remove Lesson reference from Chapter.descriptionBN.
 * 3. Remove Lesson reference from Chapter.descriptionEng.
 * 4. Delete Lesson row.
 *
 * CQ / MCQ records are NOT touched.
 *
 * No content IDs are renumbered because content blocks
 * have no IDs.
 * ================================================================
 */

export async function deleteLesson(id: string) {
  /**
   * --------------------------------------------------
   * Find Lesson
   * --------------------------------------------------
   */

  const lesson = await prisma.orm.public.Lesson.first({
    id,
  });

  if (!lesson) {
    return null;
  }

  /**
   * --------------------------------------------------
   * Remove Lesson reference from parent Chapter
   * --------------------------------------------------
   *
   * This removes the reference from both language
   * documents.
   */

  await removeLessonFromChapterStructure(lesson.chapterId, lesson.id);

  /**
   * --------------------------------------------------
   * Delete Lesson
   * --------------------------------------------------
   *
   * Only the Lesson entity itself is deleted here.
   *
   * CQ / MCQ records remain untouched.
   */

  return prisma.orm.public.Lesson.where({
    id: lesson.id,
  }).delete();
}

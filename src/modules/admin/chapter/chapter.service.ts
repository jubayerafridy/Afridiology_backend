import { prisma } from "../../../config/prisma.js";

/**
 * ================================================================
 * JSON TYPES
 * ================================================================
 */

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * ================================================================
 * CHAPTER DOCUMENT
 * ================================================================
 *
 * Chapter.descriptionBN / descriptionEng are the complete
 * ordered documents for the Chapter.
 *
 * Example:
 *
 * descriptionBN:
 *
 * [
 *   {
 *     "type": "text",
 *     "content": "..."
 *   },
 *   {
 *     "type": "lesson",
 *     "lessonID": 45
 *   },
 *   {
 *     "type": "heading",
 *     "content": "..."
 *   },
 *   {
 *     "type": "lesson",
 *     "lessonID": 46
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * - Content blocks do NOT have an id.
 * - Array position determines order.
 * - lessonID identifies the actual Lesson row.
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

export interface ChapterDocumentItem {
  type: string;
  [key: string]: JsonValue;
}

export type ChapterDocument = ChapterDocumentItem[];

/**
 * Backward-compatible type name.
 *
 * Existing callers may still import ChapterStructure.
 * Internally it now means the ordered Chapter document.
 */
export type ChapterStructure = ChapterDocument;

/**
 * ================================================================
 * INPUT TYPES
 * ================================================================
 */

export interface CreateChapterInput {
  subjectId: number;
  chapterNo: number;
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

export interface UpdateChapterInput {
  chapterNo: number;
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
 * Chapter document.
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
 *   type: "lesson",
 *   lessonID: 45
 * }
 */
function normalizeChapterDocument(value: unknown): ChapterDocument {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ChapterDocument = [];

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

    normalized.push(candidate as ChapterDocumentItem);
  }

  return normalized;
}

/**
 * ================================================================
 * LESSON REFERENCE HELPERS
 * ================================================================
 */

/**
 * Safely extracts a numeric Lesson ID from a document item.
 *
 * Only items with:
 *
 * {
 *   type: "lesson",
 *   lessonID: number
 * }
 *
 * are treated as Lesson references.
 */
function getLessonId(item: ChapterDocumentItem): number | null {
  if (item.type !== "lesson") {
    return null;
  }

  const lessonId = item.lessonID;

  if (
    typeof lessonId !== "number" ||
    !Number.isInteger(lessonId) ||
    lessonId <= 0
  ) {
    return null;
  }

  return lessonId;
}

/**
 * ================================================================
 * CREATE CHAPTER
 * ================================================================
 *
 * A newly created Chapter receives its complete
 * descriptionBN / descriptionEng document.
 *
 * No structure field is written.
 * ================================================================
 */

export async function createChapter(data: CreateChapterInput) {
  const subject = await prisma.orm.public.Subject.first({
    id: data.subjectId,
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  const existingChapter = await prisma.orm.public.Chapter.first({
    subjectId: data.subjectId,
    chapterNo: data.chapterNo,
  });

  if (existingChapter) {
    throw new Error(
      "A chapter with this serial number already exists for this subject",
    );
  }

  const descriptionBN = normalizeChapterDocument(data.descriptionBN);

  const descriptionEng = normalizeChapterDocument(data.descriptionEng);

  return prisma.orm.public.Chapter.create({
    subjectId: data.subjectId,
    chapterNo: data.chapterNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,

    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * GET CHAPTERS
 * ================================================================
 */

export async function getChapters(subjectId: number) {
  return prisma.orm.public.Chapter.where({
    subjectId,
  })
    .orderBy((chapter) => chapter.chapterNo.asc())
    .all();
}

/**
 * ================================================================
 * GET SINGLE CHAPTER
 * ================================================================
 */

export async function getChapter(id: number) {
  return prisma.orm.public.Chapter.first({
    id,
  });
}

/**
 * ================================================================
 * UPDATE CHAPTER
 * ================================================================
 *
 * The complete ordered documents are saved through:
 *
 * descriptionBN
 * descriptionEng
 *
 * Array order is preserved.
 *
 * No block IDs are generated or modified.
 * ================================================================
 */

export async function updateChapter(id: number, data: UpdateChapterInput) {
  const chapter = await prisma.orm.public.Chapter.first({
    id,
  });

  if (!chapter) {
    return null;
  }

  const duplicate = await prisma.orm.public.Chapter.where({
    subjectId: chapter.subjectId,
    chapterNo: data.chapterNo,
  }).first();

  if (duplicate && duplicate.id !== id) {
    throw new Error(
      "A chapter with this serial number already exists for this subject",
    );
  }

  const descriptionBN = normalizeChapterDocument(data.descriptionBN);

  const descriptionEng = normalizeChapterDocument(data.descriptionEng);

  return prisma.orm.public.Chapter.where({
    id,
  }).update({
    chapterNo: data.chapterNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,

    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * SET COMPLETE CHAPTER DOCUMENT
 * ================================================================
 *
 * Kept under the existing function name so current callers
 * do not need to be changed immediately.
 *
 * The function now updates BOTH:
 *
 * descriptionBN
 * descriptionEng
 *
 * when both are supplied.
 *
 * The preferred new caller should provide both documents.
 * ================================================================
 */

export async function setChapterStructure(
  chapterId: number,
  descriptionBN: ChapterDocument,
  descriptionEng?: ChapterDocument,
) {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    return null;
  }

  const normalizedBN = normalizeChapterDocument(descriptionBN);

  /*
   * If English is not supplied, preserve the existing
   * English document instead of accidentally deleting it.
   *
   * This keeps this function safe for any existing caller
   * while the frontend is migrated.
   */
  const normalizedEng =
    descriptionEng !== undefined
      ? normalizeChapterDocument(descriptionEng)
      : normalizeChapterDocument(chapter.descriptionEng);

  return prisma.orm.public.Chapter.where({
    id: chapterId,
  }).update({
    descriptionBN: normalizedBN,
    descriptionEng: normalizedEng,
  });
}

/**
 * ================================================================
 * APPEND LESSON REFERENCE
 * ================================================================
 *
 * Called after a Lesson is successfully created.
 *
 * Example:
 *
 * {
 *   "type": "lesson",
 *   "lessonID": 45
 * }
 *
 * is appended to BOTH:
 *
 * Chapter.descriptionBN
 * Chapter.descriptionEng
 *
 * No block id is generated.
 *
 * Existing content is preserved.
 * Existing Lesson references are preserved.
 *
 * The new Lesson is appended to the end.
 * ================================================================
 */

export async function appendLessonToChapterStructure(
  chapterId: number,
  lessonId: number,
) {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  /*
   * Make sure the referenced Lesson actually belongs
   * to this Chapter.
   */
  const lesson = await prisma.orm.public.Lesson.first({
    id: lessonId,
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  if (lesson.chapterId !== chapterId) {
    throw new Error("Lesson does not belong to this Chapter");
  }

  const descriptionBN = normalizeChapterDocument(chapter.descriptionBN);

  const descriptionEng = normalizeChapterDocument(chapter.descriptionEng);

  /*
   * Prevent duplicate Lesson references independently
   * in each language document.
   *
   * Normally both documents should stay synchronized.
   */

  const bnAlreadyExists = descriptionBN.some(
    (item) => getLessonId(item) === lessonId,
  );

  const engAlreadyExists = descriptionEng.some(
    (item) => getLessonId(item) === lessonId,
  );

  /*
   * If the reference is already present in both documents,
   * there is nothing to do.
   */
  if (bnAlreadyExists && engAlreadyExists) {
    return chapter;
  }

  /*
   * Keep BN and English documents synchronized.
   *
   * If one language already contains the reference,
   * append it only to the missing language.
   */
  if (!bnAlreadyExists) {
    descriptionBN.push({
      type: "lesson",
      lessonID: lessonId,
    });
  }

  if (!engAlreadyExists) {
    descriptionEng.push({
      type: "lesson",
      lessonID: lessonId,
    });
  }

  return prisma.orm.public.Chapter.where({
    id: chapterId,
  }).update({
    descriptionBN,
    descriptionEng,
  });
}

/**
 * ================================================================
 * REMOVE LESSON REFERENCE
 * ================================================================
 *
 * Called when a Lesson is deleted.
 *
 * Removes:
 *
 * {
 *   type: "lesson",
 *   lessonID: lessonId
 * }
 *
 * from BOTH:
 *
 * Chapter.descriptionBN
 * Chapter.descriptionEng
 *
 * All other content remains untouched.
 *
 * Array order of the remaining items is preserved.
 *
 * There is no renumbering because content blocks have
 * no ids.
 * ================================================================
 */

export async function removeLessonFromChapterStructure(
  chapterId: number,
  lessonId: number,
) {
  const chapter = await prisma.orm.public.Chapter.first({
    id: chapterId,
  });

  if (!chapter) {
    return null;
  }

  const descriptionBN = normalizeChapterDocument(chapter.descriptionBN);

  const descriptionEng = normalizeChapterDocument(chapter.descriptionEng);

  const nextDescriptionBN = descriptionBN.filter(
    (item) => getLessonId(item) !== lessonId,
  );

  const nextDescriptionEng = descriptionEng.filter(
    (item) => getLessonId(item) !== lessonId,
  );

  /*
   * Nothing changed.
   */
  if (
    nextDescriptionBN.length === descriptionBN.length &&
    nextDescriptionEng.length === descriptionEng.length
  ) {
    return chapter;
  }

  return prisma.orm.public.Chapter.where({
    id: chapterId,
  }).update({
    descriptionBN: nextDescriptionBN,

    descriptionEng: nextDescriptionEng,
  });
}

/**
 * ================================================================
 * DELETE CHAPTER
 * ================================================================
 */

export async function deleteChapter(id: number) {
  const chapter = await prisma.orm.public.Chapter.first({
    id,
  });

  if (!chapter) {
    return null;
  }

  return prisma.orm.public.Chapter.where({
    id,
  }).delete();
}

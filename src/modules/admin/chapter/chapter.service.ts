import { prisma } from "../../../config/prisma.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

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

  return prisma.orm.public.Chapter.create({
    subjectId: data.subjectId,
    chapterNo: data.chapterNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function getChapters(subjectId: number) {
  return prisma.orm.public.Chapter.where({
    subjectId,
  })
    .orderBy((chapter) => chapter.chapterNo.asc())
    .all();
}

export async function getChapter(id: number) {
  return prisma.orm.public.Chapter.first({
    id,
  });
}

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

  return prisma.orm.public.Chapter.where({ id }).update({
    chapterNo: data.chapterNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function deleteChapter(id: number) {
  const chapter = await prisma.orm.public.Chapter.first({
    id,
  });

  if (!chapter) {
    return null;
  }

  return prisma.orm.public.Chapter.where({ id }).delete();
}

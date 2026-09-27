import { prisma } from "../../../config/prisma.js";

export interface CreateLessonInput {
  chapterId: number;
  lessonNo: string;
  nameBN: string;
  nameEng: string;
  descriptionBN: string;
  descriptionEng: string;
}

export interface UpdateLessonInput {
  lessonNo: string;
  nameBN: string;
  nameEng: string;
  descriptionBN: string;
  descriptionEng: string;
}

export async function createLesson(data: CreateLessonInput) {
  const chapter = await prisma.orm.public.Chapter.first({
    id: data.chapterId,
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  const existingLesson = await prisma.orm.public.Lesson.first({
    chapterId: data.chapterId,
    lessonNo: data.lessonNo,
  });

  if (existingLesson) {
    throw new Error(
      "A lesson with this serial number already exists for this chapter",
    );
  }

  return prisma.orm.public.Lesson.create({
    chapterId: data.chapterId,
    lessonNo: data.lessonNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function getLessons(chapterId?: number) {
  if (chapterId !== undefined) {
    return prisma.orm.public.Lesson.where({
      chapterId,
    })
      .orderBy((lesson) => lesson.id.asc())
      .all();
  }

  return prisma.orm.public.Lesson.orderBy((lesson) => lesson.id.asc()).all();
}

export async function getLesson(id: number) {
  return prisma.orm.public.Lesson.first({
    id,
  });
}

export async function updateLesson(id: number, data: UpdateLessonInput) {
  const lesson = await prisma.orm.public.Lesson.first({
    id,
  });

  if (!lesson) {
    return null;
  }

  const duplicate = await prisma.orm.public.Lesson.where({
    chapterId: lesson.chapterId,
    lessonNo: data.lessonNo,
  }).first();

  if (duplicate && duplicate.id !== id) {
    throw new Error(
      "A lesson with this serial number already exists for this chapter",
    );
  }

  return prisma.orm.public.Lesson.where({
    id,
  }).update({
    lessonNo: data.lessonNo,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function deleteLesson(id: number) {
  const lesson = await prisma.orm.public.Lesson.first({
    id,
  });

  if (!lesson) {
    return null;
  }

  return prisma.orm.public.Lesson.where({
    id,
  }).delete();
}

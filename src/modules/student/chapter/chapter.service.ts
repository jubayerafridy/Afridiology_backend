import { prisma } from "../../../config/prisma.js";

export async function getChaptersBySubject(subjectId: number) {
  const subject = await prisma.orm.public.Subject.first({
    id: subjectId,
  });

  if (!subject || !subject.isActive) {
    const error = new Error("Subject not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  const chapters = await prisma.orm.public.Chapter.where({
    subjectId,
    isActive: true,
  })
    .orderBy((chapter) => chapter.chapterNo.asc())
    .all();

  return {
    subject: {
      id: subject.id,
      name: subject.name,
    },

    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      chapterNo: chapter.chapterNo,
      nameBN: chapter.nameBN,
      nameEng: chapter.nameEng,

      // JSON content documents.
      // The blocks array inside each document preserves the
      // exact author-defined rendering order for the frontend.
      descriptionBN: chapter.descriptionBN,
      descriptionEng: chapter.descriptionEng,
    })),
  };
}

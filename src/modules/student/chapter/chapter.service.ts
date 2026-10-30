import { prisma } from "../../../config/prisma.js";

export type ChapterLanguage = "bangla" | "english";

export async function getChaptersBySubject(subjectId: string, language: ChapterLanguage = "bangla", includeInactive: boolean = false) {
  const subject = await prisma.orm.public.Subject.first({
    id: subjectId,
  });

  if (!subject || !subject.isActive) {
    const error = new Error("Subject not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  const chapters = await prisma.orm.public.Chapter.where(includeInactive ? { subjectId } : { subjectId, isActive: true })
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
      isActive: chapter.isActive,
      name: language === "bangla" ? chapter.nameBN : chapter.nameEng,

      description: chapter.isActive ? (language === "bangla" ? chapter.descriptionBN : chapter.descriptionEng) : null,
    })),
  };
}

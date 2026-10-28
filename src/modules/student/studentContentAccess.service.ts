import { prisma } from "../../config/prisma.js";

export async function hasActiveChapter(chapterId: string): Promise<boolean> {
  const chapter = await prisma.orm.public.Chapter.first({ id: chapterId, isActive: true });
  if (!chapter) return false;
  return Boolean(await prisma.orm.public.Subject.first({ id: chapter.subjectId, isActive: true }));
}

export async function hasActiveLesson(lessonId: string): Promise<boolean> {
  const lesson = await prisma.orm.public.Lesson.first({ id: lessonId, isActive: true });
  return Boolean(lesson && await hasActiveChapter(lesson.chapterId));
}

export async function hasActiveConcept(conceptId: string): Promise<boolean> {
  const concept = await prisma.orm.public.Concept.first({ id: conceptId, isActive: true });
  return Boolean(concept && await hasActiveLesson(concept.lessonId));
}

export async function hasActiveExecution(executionId: string): Promise<boolean> {
  const execution = await prisma.orm.public.Execution.first({ id: executionId, isActive: true });
  return Boolean(execution && await hasActiveConcept(execution.conceptId));
}

export async function hasActiveQuestionPaper(questionPaperId: string): Promise<boolean> {
  const paper = await prisma.orm.public.QuestionPaper.first({ id: questionPaperId, isActive: true });
  return Boolean(paper && await prisma.orm.public.Subject.first({ id: paper.subjectId, isActive: true }));
}

import { prisma } from "../../../config/prisma.js";

export interface CreateSubjectInput {
  educationLevelId: string;
  name: string;
}

export interface UpdateSubjectInput {
  name: string;
}

export async function createSubject(data: CreateSubjectInput) {
  const educationLevel = await prisma.orm.public.EducationLevel.first({
    id: data.educationLevelId,
  });

  if (!educationLevel) {
    throw new Error("Education level not found");
  }

  return prisma.orm.public.Subject.create({
    educationLevelId: data.educationLevelId,
    name: data.name,
  });
}

export async function getSubjects(educationLevelId?: string) {
  if (educationLevelId !== undefined) {
    return prisma.orm.public.Subject.where({
      educationLevelId,
    })
      .orderBy((subject) => subject.id.asc())
      .all();
  }

  return prisma.orm.public.Subject.orderBy((subject) => subject.id.asc()).all();
}

export async function updateSubject(id: string, data: UpdateSubjectInput) {
  const subject = await prisma.orm.public.Subject.first({
    id,
  });

  if (!subject) {
    return null;
  }

  return prisma.orm.public.Subject.where({ id }).update({
    name: data.name,
  });
}

export async function deleteSubject(id: string) {
  const subject = await prisma.orm.public.Subject.first({
    id,
  });

  if (!subject) {
    return null;
  }

  return prisma.orm.public.Subject.where({ id }).delete();
}

import { prisma } from "../../../config/prisma.js";

export interface CreateEducationLevelInput {
  name: string;
}

export interface UpdateEducationLevelInput {
  name: string;
}

export async function createEducationLevel(data: CreateEducationLevelInput) {
  return prisma.orm.public.EducationLevel.create({
    name: data.name,
  });
}

export async function getEducationLevels() {
  return prisma.orm.public.EducationLevel.orderBy((educationLevel) =>
    educationLevel.id.asc(),
  ).all();
}

export async function updateEducationLevel(
  id: string,
  data: UpdateEducationLevelInput,
) {
  const educationLevel = await prisma.orm.public.EducationLevel.first({
    id,
  });

  if (!educationLevel) {
    return null;
  }

  return prisma.orm.public.EducationLevel.where({ id }).update({
    name: data.name,
  });
}

export async function deleteEducationLevel(id: string) {
  const educationLevel = await prisma.orm.public.EducationLevel.first({
    id,
  });

  if (!educationLevel) {
    return null;
  }

  return prisma.orm.public.EducationLevel.where({ id }).delete();
}

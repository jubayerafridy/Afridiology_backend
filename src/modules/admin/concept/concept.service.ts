import { prisma } from "../../../config/prisma.js";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { readonly [key: string]: JsonValue };

export interface CreateConceptInput {
  lessonId: number;
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

export interface UpdateConceptInput {
  nameBN: string;
  nameEng: string;
  descriptionBN: JsonValue;
  descriptionEng: JsonValue;
}

export async function createConcept(data: CreateConceptInput) {
  const lesson = await prisma.orm.public.Lesson.first({
    id: data.lessonId,
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  return prisma.orm.public.Concept.create({
    lessonId: data.lessonId,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function getConcepts(lessonId?: number) {
  if (lessonId !== undefined) {
    return prisma.orm.public.Concept.where({
      lessonId,
    })
      .orderBy((concept) => concept.id.asc())
      .all();
  }

  return prisma.orm.public.Concept.orderBy((concept) => concept.id.asc()).all();
}

export async function getConcept(id: number) {
  return prisma.orm.public.Concept.first({
    id,
  });
}

export async function updateConcept(id: number, data: UpdateConceptInput) {
  const concept = await prisma.orm.public.Concept.first({
    id,
  });

  if (!concept) {
    return null;
  }

  return prisma.orm.public.Concept.where({ id }).update({
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function deleteConcept(id: number) {
  const concept = await prisma.orm.public.Concept.first({
    id,
  });

  if (!concept) {
    return null;
  }

  return prisma.orm.public.Concept.where({ id }).delete();
}

import { prisma } from "../../../config/prisma.js";

export interface CreateExecutionInput {
  conceptId: number;
  nameBN: string;
  nameEng: string;
  descriptionBN: string;
  descriptionEng: string;
}

export async function createExecution(data: CreateExecutionInput) {
  const concept = await prisma.orm.public.Concept.first({
    id: data.conceptId,
  });

  if (!concept) {
    throw new Error("Concept not found");
  }

  return prisma.orm.public.Execution.create({
    conceptId: data.conceptId,
    nameBN: data.nameBN,
    nameEng: data.nameEng,
    descriptionBN: data.descriptionBN,
    descriptionEng: data.descriptionEng,
  });
}

export async function getExecutions(conceptId?: number) {
  if (conceptId !== undefined) {
    return prisma.orm.public.Execution.where({
      conceptId,
    })
      .orderBy((execution) => execution.id.asc())
      .all();
  }

  return prisma.orm.public.Execution.orderBy((execution) =>
    execution.id.asc(),
  ).all();
}

export async function deleteExecution(id: number) {
  const execution = await prisma.orm.public.Execution.first({
    id,
  });

  if (!execution) {
    return null;
  }

  return prisma.orm.public.Execution.where({ id }).delete();
}

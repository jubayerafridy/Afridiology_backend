import { prisma } from "../../../config/prisma.js";

export type CQPart = "ka" | "kha" | "ga" | "gha";
export type CQLanguage = "BN" | "Eng";

const answerFields = {
  ka: {
    BN: "ansKaBN",
    Eng: "ansKaEng",
  },
  kha: {
    BN: "ansKhaBN",
    Eng: "ansKhaEng",
  },
  ga: {
    BN: "ansGaBN",
    Eng: "ansGaEng",
  },
  gha: {
    BN: "ansGhaBN",
    Eng: "ansGhaEng",
  },
} as const;

export async function getCQAnswer(
  cqId: string,
  part: CQPart,
  language: CQLanguage,
) {
  const cq = await prisma.orm.public.CQ.first({
    id: cqId,
  });

  if (!cq) {
    return null;
  }

  const field = answerFields[part][language];
  const answer = cq[field];

  if (answer === null || answer === undefined) {
    return null;
  }

  // Return the saved JSON object exactly as stored.
  // Do not add metadata, restructure it, or transform its contents.
  return answer;
}

import { prisma } from "../../../config/prisma.js";

export type CQLanguage = "bangla" | "english";

export async function getCQDetail(id: string, language: CQLanguage = "bangla") {
  const cq = await prisma.orm.public.CQ.first({ id });
  if (!cq || !cq.isActive) return null;

  const questionPaper = await prisma.orm.public.QuestionPaper.first({ id: cq.questionPaperId });
  if (!questionPaper || !questionPaper.isActive) return null;

  return {
    id: cq.id,
    questionPaperId: cq.questionPaperId,
    qusNo: cq.qusNo,
    source: {
      type: questionPaper.source,
      board: questionPaper.board,
      institution: questionPaper.institution,
      year: questionPaper.year,
    },
    description: language === "bangla" ? cq.descriptionBN : cq.descriptionEng,
    stimulus: cq.quesUddipok,
    questions: {
      a: language === "bangla" ? cq.quesKaBN : cq.quesKaEng,
      b: language === "bangla" ? cq.quesKhaBN : cq.quesKhaEng,
      c: language === "bangla" ? cq.quesGaBN : cq.quesGaEng,
      d: language === "bangla" ? cq.quesGhaBN : cq.quesGhaEng,
    },
    answers: {
      a: language === "bangla" ? cq.ansKaBN : cq.ansKaEng,
      b: language === "bangla" ? cq.ansKhaBN : cq.ansKhaEng,
      c: language === "bangla" ? cq.ansGaBN : cq.ansGaEng,
      d: language === "bangla" ? cq.ansGhaBN : cq.ansGhaEng,
    },
    imageUrl: cq.imageUrl,
  };
}

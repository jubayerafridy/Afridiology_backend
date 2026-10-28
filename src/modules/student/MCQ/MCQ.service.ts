import { prisma } from "../../../config/prisma.js";
import { hasActiveQuestionPaper } from "../studentContentAccess.service.js";

export type MCQLanguage = "bangla" | "english";

export async function getMCQDetail(id: string, language: MCQLanguage = "bangla") {
  const mcq = await prisma.orm.public.MCQ.first({ id });
  if (!mcq || !mcq.isActive) return null;

  const questionPaper = await prisma.orm.public.QuestionPaper.first({ id: mcq.questionPaperId });
  if (!questionPaper || !questionPaper.isActive || !await hasActiveQuestionPaper(questionPaper.id)) return null;

  return {
    id: mcq.id,
    questionPaperId: mcq.questionPaperId,
    qusNo: mcq.qusNo,
    source: {
      type: questionPaper.source,
      board: questionPaper.board,
      institution: questionPaper.institution,
      year: questionPaper.year,
    },
    description: language === "bangla" ? mcq.descriptionBN : mcq.descriptionEng,
    stimulus: null,
    options: language === "bangla" ? mcq.optionsBN : mcq.optionsEng,
    rightAnswer: mcq.rightAns,
    explanation: language === "bangla" ? mcq.explanationBN : mcq.explanationEng,
    imageUrl: mcq.imageUrl,
  };
}

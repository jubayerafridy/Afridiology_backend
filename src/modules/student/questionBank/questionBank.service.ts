import { prisma } from "../../../config/prisma.js";
import { isUuid } from "../student.validation.js";
import { hasActiveQuestionPaper } from "../studentContentAccess.service.js";

export type QuestionBankType = "CQ" | "MCQ";
export type RequestLanguage = "english" | "bangla";

function normalizeLanguage(language?: string): RequestLanguage {
  if (language === undefined) return "bangla";
  if (language === "english") return "english";
  if (language === "bangla") return "bangla";

  const error = new Error("Language must be either english or bangla");
  error.name = "BAD_REQUEST";
  throw error;
}

type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

type KnowledgeLink = {
  type: KnowledgeLinkType | null;
  id: string | null;
};

/* =========================================================
 * VALIDATION
 * ========================================================= */

function validateQuestionBankType(type: string): QuestionBankType {
  if (type !== "CQ" && type !== "MCQ") {
    const error = new Error("Type must be either CQ or MCQ");
    error.name = "BAD_REQUEST";
    throw error;
  }

  return type;
}

function validateUuid(value: string, fieldName: string): void {
  if (!isUuid(value)) {
    const error = new Error(`${fieldName} must be a valid UUID`);
    error.name = "BAD_REQUEST";
    throw error;
  }
}

/* =========================================================
 * CQ KNOWLEDGE LINK → CHAPTER
 * ========================================================= */

async function getCQKnowledgeLinkChapterId(link: KnowledgeLink): Promise<string | null> {
  if (!link.type || typeof link.id !== "string" || link.id.trim().length === 0) {
    return null;
  }

  switch (link.type) {
    case "CHAPTER": {
      const chapter = await prisma.orm.public.Chapter.first({
        id: link.id,
      });

      return chapter?.id ?? null;
    }

    case "LESSON": {
      const lesson = await prisma.orm.public.Lesson.first({
        id: link.id,
      });

      return lesson?.chapterId ?? null;
    }

    case "CONCEPT": {
      const concept = await prisma.orm.public.Concept.first({
        id: link.id,
      });

      if (!concept) return null;

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      return lesson?.chapterId ?? null;
    }

    case "EXECUTION": {
      const execution = await prisma.orm.public.Execution.first({
        id: link.id,
      });

      if (!execution) return null;

      const concept = await prisma.orm.public.Concept.first({
        id: execution.conceptId,
      });

      if (!concept) return null;

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      return lesson?.chapterId ?? null;
    }

    default:
      return null;
  }
}

/**
 * Resolve the chapter for a CQ from its four knowledge links.
 * The links are checked in question order: Ka → Kha → Ga → Gha.
 * The first valid chapter mapping is used.
 */
async function getCQChapterId(cq: {
  quesKaLinkType: string | null;
  quesKaLinkId: string | null;
  quesKhaLinkType: string | null;
  quesKhaLinkId: string | null;
  quesGaLinkType: string | null;
  quesGaLinkId: string | null;
  quesGhaLinkType: string | null;
  quesGhaLinkId: string | null;
}): Promise<string | null> {
  const links: KnowledgeLink[] = [
    {
      type: cq.quesKaLinkType as KnowledgeLinkType | null,
      id: cq.quesKaLinkId,
    },
    {
      type: cq.quesKhaLinkType as KnowledgeLinkType | null,
      id: cq.quesKhaLinkId,
    },
    {
      type: cq.quesGaLinkType as KnowledgeLinkType | null,
      id: cq.quesGaLinkId,
    },
    {
      type: cq.quesGhaLinkType as KnowledgeLinkType | null,
      id: cq.quesGhaLinkId,
    },
  ];

  for (const link of links) {
    const chapterId = await getCQKnowledgeLinkChapterId(link);

    if (chapterId !== null) {
      return chapterId;
    }
  }

  return null;
}

/* =========================================================
 * BOARD PAPERS
 * ========================================================= */

/**
 * Return active board papers for a subject.
 *
 * A board paper can be shared by CQ and MCQ records.
 * Therefore, do not filter board papers by questionType.
 *
 * The optional type parameter is retained for compatibility
 * with existing callers. When provided, it is validated but
 * does not exclude shared board papers.
 *
 * The listing response intentionally excludes questionType.
 */
export async function getBoardPapers(subjectId: string, type?: string) {
  validateUuid(subjectId, "subjectId");

  if (type !== undefined) {
    validateQuestionBankType(type);
  }

  const subject = await prisma.orm.public.Subject.first({
    id: subjectId,
  });

  if (!subject || !subject.isActive) {
    const error = new Error("Subject not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  const papers = await prisma.orm.public.QuestionPaper.where({
    subjectId,
    source: "BOARD",
    isActive: true,
  }).all();

  papers.sort((a, b) => {
    const yearA = a.year ?? 0;
    const yearB = b.year ?? 0;

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return (a.board ?? "").localeCompare(b.board ?? "");
  });

  return papers.map((paper) => ({
    id: paper.id,
    board: paper.board,
    year: paper.year,
  }));
}

/* =========================================================
 * TEST PAPERS
 * ========================================================= */

export async function getTestPapers(subjectId: string, type: string) {
  validateUuid(subjectId, "subjectId");

  const questionType = validateQuestionBankType(type);

  const subject = await prisma.orm.public.Subject.first({
    id: subjectId,
  });

  if (!subject || !subject.isActive) {
    const error = new Error("Subject not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  const papers = await prisma.orm.public.QuestionPaper.where({
    subjectId,
    questionType,
    source: "TEST_PAPER",
    isActive: true,
  }).all();

  papers.sort((a, b) => {
    const yearA = a.year ?? 0;
    const yearB = b.year ?? 0;

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return (a.institution ?? "").localeCompare(b.institution ?? "");
  });

  return papers.map((paper) => ({
    id: paper.id,
    institution: paper.institution,
    year: paper.year,
    questionType: paper.questionType,
  }));
}

/* =========================================================
 * PAPER CQs
 * ========================================================= */

export async function getPaperCQs(paperId: string, requestedLanguage?: string) {
  validateUuid(paperId, "paperId");

  const language = normalizeLanguage(requestedLanguage);

  const paper = await prisma.orm.public.QuestionPaper.first({
    id: paperId,
  });

  if (!paper || !paper.isActive || paper.questionType !== "CQ" || !await hasActiveQuestionPaper(paper.id)) {
    const error = new Error("CQ question paper not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  const cqs = await prisma.orm.public.CQ.where({
    questionPaperId: paperId,
    isActive: true,
  }).all();

  // Numbered CQs come first in ascending order.
  // Unnumbered CQs come afterward in deterministic ID order.
  cqs.sort((a, b) => {
    const aHasNumber = a.qusNo !== null && a.qusNo !== undefined;
    const bHasNumber = b.qusNo !== null && b.qusNo !== undefined;

    if (aHasNumber && !bHasNumber) return -1;
    if (!aHasNumber && bHasNumber) return 1;

    if (!aHasNumber && !bHasNumber) {
      return a.id.localeCompare(b.id);
    }

    return (a.qusNo as number) - (b.qusNo as number);
  });

  const questions = await Promise.all(
    cqs.map(async (cq) => ({
      id: cq.id,
      qusNo: cq.qusNo,
      chapterId: await getCQChapterId(cq),

      description: language === "bangla" ? cq.descriptionBN : cq.descriptionEng,

      questions: Object.fromEntries(
        Object.entries(
          language === "bangla"
            ? {
                a: cq.quesKaBN,
                b: cq.quesKhaBN,
                c: cq.quesGaBN,
                d: cq.quesGhaBN,
              }
            : {
                a: cq.quesKaEng,
                b: cq.quesKhaEng,
                c: cq.quesGaEng,
                d: cq.quesGhaEng,
              },
        ).filter(([, value]) => value !== null && value !== undefined && value !== ""),
      ),

      imageUrl: cq.imageUrl,
    })),
  );

  return {
    paper: {
      id: paper.id,
      class: paper.class,
      subjectId: paper.subjectId,
      questionType: paper.questionType,
      source: paper.source,
      board: paper.board,
      institution: paper.institution,
      year: paper.year,
    },
    questions,
  };
}

/* =========================================================
 * PAPER MCQs
 * ========================================================= */

export async function getPaperMCQs(paperId: string, requestedLanguage?: string) {
  validateUuid(paperId, "paperId");

  const language = normalizeLanguage(requestedLanguage);

  const paper = await prisma.orm.public.QuestionPaper.first({
    id: paperId,
  });

  /*
   * Do not require paper.questionType === "MCQ".
   *
   * The same QuestionPaper may be referenced by both CQ and
   * MCQ records. The presence of active MCQ records determines
   * whether this endpoint has MCQs to return.
   */
  if (!paper || !paper.isActive || !await hasActiveQuestionPaper(paper.id)) {
    const error = new Error("MCQ question paper not found");
    error.name = "NOT_FOUND";
    throw error;
  }

  const mcqs = await prisma.orm.public.MCQ.where({
    questionPaperId: paperId,
    isActive: true,
  }).all();

  mcqs.sort((a, b) => {
    const aNumber = a.qusNo ?? Number.MAX_SAFE_INTEGER;
    const bNumber = b.qusNo ?? Number.MAX_SAFE_INTEGER;

    if (aNumber !== bNumber) {
      return aNumber - bNumber;
    }

    return a.id.localeCompare(b.id);
  });

  return {
    paper: {
      id: paper.id,
      class: paper.class,
      subjectId: paper.subjectId,
      questionType: paper.questionType,
      source: paper.source,
      board: paper.board,
      institution: paper.institution,
      year: paper.year,
    },

    language,

    questions: mcqs.map((mcq) => ({
      id: mcq.id,
      qusNo: mcq.qusNo,

      description: language === "bangla" ? mcq.descriptionBN : mcq.descriptionEng,

      options: language === "bangla" ? mcq.optionsBN : mcq.optionsEng,

      imageUrl: mcq.imageUrl,
    })),
  };
}

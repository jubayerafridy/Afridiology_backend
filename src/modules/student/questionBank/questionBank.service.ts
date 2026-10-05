import { prisma } from "../../../config/prisma.js";

export type QuestionBankType = "CQ" | "MCQ";

type KnowledgeLinkType = "CHAPTER" | "LESSON" | "CONCEPT" | "EXECUTION";

type KnowledgeLink = {
  type: KnowledgeLinkType | null;
  id: number | null;
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

function validatePositiveId(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error(`${fieldName} must be a positive integer`);

    error.name = "BAD_REQUEST";

    throw error;
  }
}

/* =========================================================
 * CQ KNOWLEDGE LINK → CHAPTER
 *
 * CQ questions store their knowledge mapping at:
 *
 * CHAPTER
 * LESSON
 * CONCEPT
 * EXECUTION
 *
 * This helper resolves any of those mappings to the owning
 * chapter. It is intentionally CQ-only for now.
 * ========================================================= */

async function getCQKnowledgeLinkChapterId(
  link: KnowledgeLink,
): Promise<number | null> {
  if (!link.type || !Number.isInteger(link.id) || (link.id ?? 0) <= 0) {
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

      if (!concept) {
        return null;
      }

      const lesson = await prisma.orm.public.Lesson.first({
        id: concept.lessonId,
      });

      return lesson?.chapterId ?? null;
    }

    case "EXECUTION": {
      const execution = await prisma.orm.public.Execution.first({
        id: link.id,
      });

      if (!execution) {
        return null;
      }

      const concept = await prisma.orm.public.Concept.first({
        id: execution.conceptId,
      });

      if (!concept) {
        return null;
      }

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
 *
 * The links are checked in question order:
 * Ka → Kha → Ga → Gha
 *
 * The first valid chapter mapping is used.
 */
async function getCQChapterId(cq: {
  quesKaLinkType: string | null;
  quesKaLinkId: number | null;

  quesKhaLinkType: string | null;
  quesKhaLinkId: number | null;

  quesGaLinkType: string | null;
  quesGaLinkId: number | null;

  quesGhaLinkType: string | null;
  quesGhaLinkId: number | null;
}): Promise<number | null> {
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

export async function getBoardPapers(subjectId: number, type: string) {
  validatePositiveId(subjectId, "subjectId");

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
    questionType: paper.questionType,
  }));
}

/* =========================================================
 * TEST PAPERS
 * ========================================================= */

export async function getTestPapers(subjectId: number, type: string) {
  validatePositiveId(subjectId, "subjectId");

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

export async function getPaperCQs(paperId: number) {
  validatePositiveId(paperId, "paperId");

  const paper = await prisma.orm.public.QuestionPaper.first({
    id: paperId,
  });

  if (!paper || !paper.isActive || paper.questionType !== "CQ") {
    const error = new Error("CQ question paper not found");

    error.name = "NOT_FOUND";

    throw error;
  }

  const cqs = await prisma.orm.public.CQ.where({
    questionPaperId: paperId,
    isActive: true,
  }).all();

  /*
   * CQ ordering:
   *
   * 1. CQs with a qusNo come first.
   * 2. Numbered CQs are sorted by qusNo ascending.
   * 3. CQs without a qusNo come afterward.
   * 4. Unnumbered CQs use id ascending so their
   *    order remains deterministic.
   *
   * This is necessary because qusNo is nullable.
   */
  cqs.sort((a, b) => {
    const aHasNumber = a.qusNo !== null && a.qusNo !== undefined;

    const bHasNumber = b.qusNo !== null && b.qusNo !== undefined;

    if (aHasNumber && !bHasNumber) {
      return -1;
    }

    if (!aHasNumber && bHasNumber) {
      return 1;
    }

    if (!aHasNumber && !bHasNumber) {
      return a.id - b.id;
    }

    return (a.qusNo as number) - (b.qusNo as number);
  });

  const questions = await Promise.all(
    cqs.map(async (cq) => ({
      id: cq.id,

      qusNo: cq.qusNo,

      chapterId: await getCQChapterId(cq),

      /*
       * JSON content documents.
       *
       * These contain the complete ordered educational
       * content for the CQ in BN and English.
       */
      descriptionBN: cq.descriptionBN,

      descriptionEng: cq.descriptionEng,

      stimulus: cq.quesUddipok,

      questions: {
        a: cq.quesKaEng,
        b: cq.quesKhaEng,
        c: cq.quesGaEng,
        d: cq.quesGhaEng,
      },

      answers: {
        a: cq.ansKaEng,
        b: cq.ansKhaEng,
        c: cq.ansGaEng,
        d: cq.ansGhaEng,
      },

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

export async function getPaperMCQs(paperId: number) {
  validatePositiveId(paperId, "paperId");

  const paper = await prisma.orm.public.QuestionPaper.first({
    id: paperId,
  });

  if (!paper || !paper.isActive || paper.questionType !== "MCQ") {
    const error = new Error("MCQ question paper not found");

    error.name = "NOT_FOUND";

    throw error;
  }

  const mcqs = await prisma.orm.public.MCQ.where({
    questionPaperId: paperId,
    isActive: true,
  }).all();

  mcqs.sort((a, b) => {
    return a.qusNo - b.qusNo;
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

    questions: mcqs.map((mcq) => ({
      id: mcq.id,
      qusNo: mcq.qusNo,

      /*
       * JSON content documents.
       *
       * These contain the complete ordered educational
       * content for the MCQ in BN and English.
       */
      descriptionBN: mcq.descriptionBN,

      descriptionEng: mcq.descriptionEng,

      stimulus: mcq.quesUddipok,

      options: mcq.optionsEng,

      rightAnswer: mcq.rightAnsEng,

      explanation: mcq.explanationEng,

      imageUrl: mcq.imageUrl,
    })),
  };
}

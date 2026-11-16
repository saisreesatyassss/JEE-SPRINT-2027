import type { CandidateQuestionInput } from './validationEngine.ts';
import type { DifficultyLevel, QuestionType, SubjectName } from '../shared/syllabus.ts';

export function buildMcq(params: {
  externalId: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionType?: Exclude<QuestionType, 'Numerical'>;
  questionText: string;
  diagramSvg?: string | null;
  correctOption: string;
  correctExplanation: string;
  distractors: Array<{ option: string; explanation: string }>;
  solution: string;
  conceptTested: string;
  formulaUsed: string;
  estimatedTimeSeconds: number;
  rotateIndex: number;
}): CandidateQuestionInput {
  const letters = ['A', 'B', 'C', 'D'] as const;
  const targetIdx = Math.abs(params.rotateIndex) % 4;

  // Ensure 4 distinct options
  const seen = new Set<string>([params.correctOption.trim().toLowerCase()]);
  const uniqueDistractors: Array<{ option: string; explanation: string }> = [];
  for (const d of params.distractors) {
    const norm = d.option.trim().toLowerCase();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      uniqueDistractors.push(d);
    }
    if (uniqueDistractors.length === 3) break;
  }

  let fallbackCounter = 1;
  while (uniqueDistractors.length < 3) {
    const candidate = `None of the values ($${fallbackCounter * 17}$)`;
    const norm = candidate.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueDistractors.push({
        option: candidate,
        explanation: 'Incorrect: Does not satisfy the governing physical/mathematical relation.',
      });
    }
    fallbackCounter++;
  }

  const options: string[] = [];
  const optionExplanations: string[] = [];
  let dIdx = 0;

  for (let i = 0; i < 4; i++) {
    if (i === targetIdx) {
      options.push(params.correctOption);
      optionExplanations.push(`Correct: ${params.correctExplanation}`);
    } else {
      const dist = uniqueDistractors[dIdx++];
      options.push(dist.option);
      optionExplanations.push(`Incorrect: ${dist.explanation}`);
    }
  }

  return {
    externalId: params.externalId,
    subject: params.subject,
    chapter: params.chapter,
    topic: params.topic,
    difficulty: params.difficulty,
    questionType: params.questionType ?? 'MCQ',
    questionText: params.questionText,
    diagramSvg: params.diagramSvg ?? null,
    options,
    optionExplanations,
    correctAnswer: letters[targetIdx],
    numericalTolerance: 0.01,
    solution: params.solution,
    conceptTested: params.conceptTested,
    formulaUsed: params.formulaUsed,
    estimatedTimeSeconds: Math.min(360, Math.max(30, params.estimatedTimeSeconds)),
    sourceType: 'Original',
    sourceReference: null,
  };
}

export function buildNumerical(params: {
  externalId: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  correctValue: number | string;
  tolerance?: number;
  solution: string;
  conceptTested: string;
  formulaUsed: string;
  estimatedTimeSeconds: number;
}): CandidateQuestionInput {
  return {
    externalId: params.externalId,
    subject: params.subject,
    chapter: params.chapter,
    topic: params.topic,
    difficulty: params.difficulty,
    questionType: 'Numerical',
    questionText: params.questionText,
    options: [],
    optionExplanations: [],
    correctAnswer: String(params.correctValue),
    numericalTolerance: params.tolerance ?? 0.02,
    solution: params.solution,
    conceptTested: params.conceptTested,
    formulaUsed: params.formulaUsed,
    estimatedTimeSeconds: Math.min(360, Math.max(30, params.estimatedTimeSeconds)),
    sourceType: 'Original',
    sourceReference: null,
  };
}

export function fmtNum(val: number, decimals = 2): string {
  if (Number.isInteger(val)) return String(val);
  return Number(val.toFixed(decimals)).toString();
}

import {
  DELETED_LEGACY_TOPICS,
  isChapterInSyllabus,
  type DifficultyLevel,
  type QuestionType,
  type SourceType,
  type SubjectName,
} from '../shared/syllabus.ts';

export interface CandidateQuestionInput {
  id?: number;
  externalId?: string;
  subject: SubjectName | string;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel | string;
  questionType: QuestionType | string;
  questionText: string;
  diagramSvg?: string | null;
  options: string[];
  optionExplanations?: string[];
  correctAnswer: string;
  numericalTolerance?: number;
  solution: string;
  conceptTested: string;
  formulaUsed: string;
  estimatedTimeSeconds?: number;
  sourceType?: SourceType | string;
  sourceReference?: string | null;
}

export interface ExistingQuestionSnippet {
  id: number;
  questionText: string;
}

export interface ValidationReport {
  stageSyllabus: boolean;
  stageMathConsistency: boolean;
  stageAnswerVerification: boolean;
  stageOptionVerification: boolean;
  stageAmbiguityCheck: boolean;
  stageDuplicateCheck: boolean;
  stageDifficultyClassification: boolean;
  stageExplanationVerification: boolean;
  independentMethodOutput: string | null;
  deterministicCheckPassed: boolean;
  duplicateSimilarityScore: number;
  overallPassed: boolean;
  rejectionReason: string | null;
  validatorModel: string;
}

function normalizeTextTokens(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    .replace(/\\([a-z]+)/g, ' $1 ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = cleaned.split(' ').filter((t) => t.length > 2 || /^\d+$/.test(t));
  return new Set(tokens);
}

export function computeJaccardSimilarity(a: string, b: string): number {
  const setA = normalizeTextTokens(a);
  const setB = normalizeTextTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Number((intersection / union).toFixed(4));
}

function hasBalancedLatexDelimiters(text: string): boolean {
  const withoutEscaped = text.replace(/\\\$/g, '');
  const blockCount = (withoutEscaped.match(/\$\$/g) || []).length;
  if (blockCount % 2 !== 0) return false;
  const singleOnly = withoutEscaped.replace(/\$\$/g, '');
  const singleCount = (singleOnly.match(/\$/g) || []).length;
  return singleCount % 2 === 0;
}

export function evaluateStudentAnswer(
  question: {
    questionType: string;
    correctAnswer: string;
    numericalTolerance?: number | null;
  },
  submittedAnswer: string
): boolean {
  const trimmed = submittedAnswer.trim();
  if (!trimmed) return false;

  if (question.questionType === 'Numerical') {
    const expected = Number(question.correctAnswer);
    const actual = Number(trimmed);
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
    const tol = Math.max(0, question.numericalTolerance ?? 0.01);
    return Math.abs(actual - expected) <= tol + 1e-9;
  }

  return trimmed.toUpperCase() === question.correctAnswer.trim().toUpperCase();
}

export function runEightStageValidation(
  input: CandidateQuestionInput,
  existingQuestions: ExistingQuestionSnippet[] = [],
  independentVerification?: {
    independentAnswer?: string;
    reasoningSummary?: string;
    validatorModel?: string;
  }
): ValidationReport {
  const reasons: string[] = [];

  // Stage 1: Syllabus Validation
  const combinedTopicText = `${input.chapter} ${input.topic} ${input.questionText}`.toLowerCase();
  const hitsDeletedTopic =
    input.chapter.trim().toLowerCase() === 'hydrogen' ||
    DELETED_LEGACY_TOPICS.some((deleted) => combinedTopicText.includes(deleted));
  const stageSyllabus =
    isChapterInSyllabus(input.subject, input.chapter) &&
    input.topic.trim().length >= 2 &&
    !hitsDeletedTopic;
  if (!stageSyllabus) {
    reasons.push(
      hitsDeletedTopic
        ? 'Contains deleted/out-of-syllabus JEE topic.'
        : `Chapter "${input.chapter}" is not in the verified JEE Main 2027 ${input.subject} syllabus.`
    );
  }

  // Stage 2: Mathematical Consistency
  const latexOk =
    hasBalancedLatexDelimiters(input.questionText) &&
    hasBalancedLatexDelimiters(input.solution) &&
    hasBalancedLatexDelimiters(input.formulaUsed) &&
    input.options.every((opt) => hasBalancedLatexDelimiters(opt));
  const stageMathConsistency = latexOk && input.formulaUsed.trim().length >= 2;
  if (!stageMathConsistency) {
    reasons.push('Unbalanced LaTeX math delimiters or missing formula reference.');
  }

  // Stage 4: Option Verification (computed before Stage 3 so answer format is verified)
  const isNumerical = input.questionType === 'Numerical';
  let stageOptionVerification = false;
  if (isNumerical) {
    const parsedNum = Number(input.correctAnswer);
    const tol = input.numericalTolerance ?? 0.01;
    stageOptionVerification =
      Number.isFinite(parsedNum) && Number.isFinite(tol) && tol >= 0;
    if (!stageOptionVerification) {
      reasons.push('Numerical question must have a finite numeric correctAnswer.');
    }
  } else {
    const cleanedOpts = input.options.map((o) => o.trim().toLowerCase()).filter(Boolean);
    const uniqueOpts = new Set(cleanedOpts);
    const validKey = ['A', 'B', 'C', 'D'].includes(input.correctAnswer.trim().toUpperCase());
    stageOptionVerification =
      input.options.length === 4 &&
      cleanedOpts.length === 4 &&
      uniqueOpts.size === 4 &&
      validKey;
    if (!stageOptionVerification) {
      reasons.push(
        'MCQ-style questions require exactly 4 distinct non-empty options and correctAnswer in {A, B, C, D}.'
      );
    }
  }

  // Stage 3: Independent & Deterministic Answer Verification
  let stageAnswerVerification = stageOptionVerification;
  let deterministicCheckPassed = stageOptionVerification;
  let independentMethodOutput = independentVerification?.reasoningSummary ?? null;

  if (independentVerification?.independentAnswer !== undefined) {
    const indAns = independentVerification.independentAnswer.trim();
    if (isNumerical) {
      const exp = Number(input.correctAnswer);
      const act = Number(indAns);
      const tol = Math.max(0.05, input.numericalTolerance ?? 0.01);
      const matched = Number.isFinite(exp) && Number.isFinite(act) && Math.abs(exp - act) <= tol;
      stageAnswerVerification = stageAnswerVerification && matched;
      deterministicCheckPassed = matched;
      if (!matched) {
        reasons.push(
          `Independent solver mismatch: expected ${input.correctAnswer}, independent solver got ${indAns}.`
        );
      }
    } else {
      const matched = indAns.toUpperCase() === input.correctAnswer.trim().toUpperCase();
      stageAnswerVerification = stageAnswerVerification && matched;
      deterministicCheckPassed = matched;
      if (!matched) {
        reasons.push(
          `Independent solver mismatch: expected ${input.correctAnswer}, independent solver got ${indAns}.`
        );
      }
    }
  }

  // Stage 5: Ambiguity Detection
  const lowerQ = input.questionText.toLowerCase();
  const hasPlaceholders =
    /\b(todo|tbd|placeholder|lorem ipsum|sample question)\b/i.test(input.questionText) ||
    input.questionText.trim().length < 20;
  const claimsOfficialWithoutRef =
    input.sourceType === 'OfficialPYQ' &&
    (!input.sourceReference || input.sourceReference.trim().length < 4);
  const hasMultipleAllOfAbove =
    !isNumerical &&
    input.options.filter((o) => /all of the above|both a and b/i.test(o)).length > 1;
  const stageAmbiguityCheck =
    !hasPlaceholders && !claimsOfficialWithoutRef && !hasMultipleAllOfAbove && !lowerQ.includes('???');
  if (!stageAmbiguityCheck) {
    reasons.push(
      claimsOfficialWithoutRef
        ? 'Official PYQ sourceType requires an explicit sourceReference.'
        : 'Question failed ambiguity/clarity checks (too short, placeholder text, or ambiguous options).'
    );
  }

  // Stage 6: Duplicate Detection
  let maxSimilarity = 0;
  for (const existing of existingQuestions) {
    if (input.id && existing.id === input.id) continue;
    const sim = computeJaccardSimilarity(input.questionText, existing.questionText);
    if (sim > maxSimilarity) maxSimilarity = sim;
  }
  const stageDuplicateCheck = maxSimilarity < 0.82;
  if (!stageDuplicateCheck) {
    reasons.push(`Duplicate detected (token similarity ${(maxSimilarity * 100).toFixed(1)}%).`);
  }

  // Stage 7: Difficulty Classification
  const validDiff = ['Easy', 'Medium', 'Hard'].includes(input.difficulty);
  const estTime = input.estimatedTimeSeconds ?? 90;
  const stageDifficultyClassification = validDiff && estTime >= 30 && estTime <= 360;
  if (!stageDifficultyClassification) {
    reasons.push('Invalid difficulty classification or estimated time out of range (30s–360s).');
  }

  // Stage 8: Explanation Verification
  const hasSolution = input.solution.trim().length >= 35;
  const hasConcept = input.conceptTested.trim().length >= 3;
  const hasOptionExplanations =
    isNumerical ||
    (Array.isArray(input.optionExplanations) &&
      input.optionExplanations.length === 4 &&
      input.optionExplanations.every((e) => e.trim().length >= 4));
  const stageExplanationVerification = hasSolution && hasConcept && hasOptionExplanations;
  if (!stageExplanationVerification) {
    reasons.push(
      'Explanation incomplete: requires detailed solution (>= 35 chars), conceptTested, and per-option explanations for MCQs.'
    );
  }

  const overallPassed =
    stageSyllabus &&
    stageMathConsistency &&
    stageAnswerVerification &&
    stageOptionVerification &&
    stageAmbiguityCheck &&
    stageDuplicateCheck &&
    stageDifficultyClassification &&
    stageExplanationVerification;

  return {
    stageSyllabus,
    stageMathConsistency,
    stageAnswerVerification,
    stageOptionVerification,
    stageAmbiguityCheck,
    stageDuplicateCheck,
    stageDifficultyClassification,
    stageExplanationVerification,
    independentMethodOutput,
    deterministicCheckPassed,
    duplicateSimilarityScore: maxSimilarity,
    overallPassed,
    rejectionReason: reasons.length > 0 ? reasons.join(' | ') : null,
    validatorModel: independentVerification?.validatorModel ?? 'deterministic-rule-engine-v1',
  };
}

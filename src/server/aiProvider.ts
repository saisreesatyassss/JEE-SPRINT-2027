import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  DifficultyLevel,
  QuestionType,
  SubjectName,
} from '../shared/syllabus.ts';

export interface GeneratedQuestionDraft {
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  questionText: string;
  options: string[];
  optionExplanations: string[];
  correctAnswer: string;
  numericalTolerance: number;
  solution: string;
  conceptTested: string;
  formulaUsed: string;
  estimatedTimeSeconds: number;
  sourceType: 'Original';
  sourceReference: null;
  aiProvider: string;
}

export interface IndependentSolveResult {
  independentAnswer: string;
  reasoningSummary: string;
  validatorModel: string;
}

export interface AIQuestionProvider {
  readonly providerName: string;
  generateQuestions(params: {
    subject: SubjectName;
    chapter: string;
    topic: string;
    difficulty: DifficultyLevel;
    questionType: QuestionType;
    count: number;
  }): Promise<GeneratedQuestionDraft[]>;
  independentlyVerifyQuestion(params: {
    subject: SubjectName;
    chapter: string;
    questionType: QuestionType;
    questionText: string;
    options: string[];
  }): Promise<IndependentSolveResult>;
}

const GEMINI_MODEL = 'gemini-4-hydrogen';

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in server environment secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export class GeminiQuestionProvider implements AIQuestionProvider {
  readonly providerName = `gemini:${GEMINI_MODEL}`;

  async generateQuestions(params: {
    subject: SubjectName;
    chapter: string;
    topic: string;
    difficulty: DifficultyLevel;
    questionType: QuestionType;
    count: number;
  }): Promise<GeneratedQuestionDraft[]> {
    const ai = createGeminiClient();
    const isNumerical = params.questionType === 'Numerical';
    const clampedCount = Math.min(Math.max(1, params.count), 5);

    const prompt = `Create ${clampedCount} original JEE Main 2027 level ${params.subject} question(s).
Chapter: ${params.chapter}
Topic: ${params.topic}
Difficulty: ${params.difficulty}
Question Type: ${params.questionType}

Strict Requirements:
- Must strictly follow the official NTA JEE Main 2027 syllabus for "${params.chapter}".
- Do NOT claim this is a previous-year question (PYQ). Generate original problems with clean integer or exact numbers.
- Use KaTeX-compatible LaTeX wrapped in single $...$ for inline math or $$...$$ for display math.
- ${
      isNumerical
        ? 'For Numerical questions: leave "options" as an empty array [] and "optionExplanations" as []. State the required unit clearly in the question stem. Set "correctAnswer" to a clean finite numeric string (e.g. "12" or "4.5") and numericalTolerance (e.g. 0.01 or 0).'
        : 'For MCQ / AssertionReason / MultiConcept questions: provide exactly 4 distinct options (without "A)", "B)" prefixes), set "correctAnswer" to one of "A", "B", "C", or "D", and provide 4 entries in "optionExplanations" explaining why each option is correct or incorrect.'
    }
- Provide a rigorous step-by-step "solution", exact "formulaUsed", "conceptTested", and realistic "estimatedTimeSeconds" (Easy: 60, Medium: 90, Hard: 135).`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert IIT-JEE Physics, Chemistry, and Mathematics faculty author. Output rigorously verified, unambiguous problems in valid JSON matching the schema.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              optionExplanations: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              numericalTolerance: { type: Type.NUMBER },
              solution: { type: Type.STRING },
              conceptTested: { type: Type.STRING },
              formulaUsed: { type: Type.STRING },
              estimatedTimeSeconds: { type: Type.INTEGER },
            },
            required: [
              'questionText',
              'options',
              'optionExplanations',
              'correctAnswer',
              'numericalTolerance',
              'solution',
              'conceptTested',
              'formulaUsed',
              'estimatedTimeSeconds',
            ],
          },
        },
      },
    });

    const rawText = (response.text ?? '[]').trim();
    const parsed = JSON.parse(rawText) as Array<{
      questionText: string;
      options: string[];
      optionExplanations: string[];
      correctAnswer: string;
      numericalTolerance: number;
      solution: string;
      conceptTested: string;
      formulaUsed: string;
      estimatedTimeSeconds: number;
    }>;

    return parsed.map((item) => ({
      subject: params.subject,
      chapter: params.chapter,
      topic: params.topic,
      difficulty: params.difficulty,
      questionType: params.questionType,
      questionText: item.questionText,
      options: isNumerical ? [] : item.options.slice(0, 4),
      optionExplanations: isNumerical ? [] : item.optionExplanations.slice(0, 4),
      correctAnswer: item.correctAnswer.trim(),
      numericalTolerance: Number.isFinite(item.numericalTolerance)
        ? item.numericalTolerance
        : 0.01,
      solution: item.solution,
      conceptTested: item.conceptTested,
      formulaUsed: item.formulaUsed,
      estimatedTimeSeconds: item.estimatedTimeSeconds || 90,
      sourceType: 'Original',
      sourceReference: null,
      aiProvider: this.providerName,
    }));
  }

  async independentlyVerifyQuestion(params: {
    subject: SubjectName;
    chapter: string;
    questionType: QuestionType;
    questionText: string;
    options: string[];
  }): Promise<IndependentSolveResult> {
    const ai = createGeminiClient();
    const isNumerical = params.questionType === 'Numerical';
    const optionsBlock = isNumerical
      ? 'This is a Numerical Value question. Compute the exact numeric answer.'
      : params.options
          .map((opt, idx) => `${['A', 'B', 'C', 'D'][idx]}. ${opt}`)
          .join('\n');

    const prompt = `Solve this JEE Main ${params.subject} (${params.chapter}) problem independently from first principles. Do NOT assume any answer key.

Problem:
${params.questionText}

${optionsBlock}

Return JSON with:
- "independentAnswer": ${isNumerical ? 'the exact finite number as a string (e.g. "24" or "2.5")' : 'only the single uppercase letter "A", "B", "C", or "D"'}
- "reasoningSummary": concise verification derivation showing final numerical/symbolic calculation.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an independent JEE exam quality auditor. Solve the problem cleanly from scratch using an independent method where possible, and double-check all arithmetic.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            independentAnswer: { type: Type.STRING },
            reasoningSummary: { type: Type.STRING },
          },
          required: ['independentAnswer', 'reasoningSummary'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      independentAnswer?: string;
      reasoningSummary?: string;
    };

    return {
      independentAnswer: (parsed.independentAnswer ?? '').trim(),
      reasoningSummary: (parsed.reasoningSummary ?? 'No independent reasoning returned.').trim(),
      validatorModel: `independent-solver:${GEMINI_MODEL}`,
    };
  }
}

export function getConfiguredAIProvider(): AIQuestionProvider {
  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();
  switch (provider) {
    case 'gemini':
    default:
      return new GeminiQuestionProvider();
  }
}

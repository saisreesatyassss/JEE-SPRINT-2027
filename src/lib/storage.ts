import { jsPDF } from 'jspdf';
import type { QuestionDTO, SubjectName } from '../shared/syllabus.ts';

const SESSION_TOKEN_KEY = 'jee_sprint_session_token_v1';
const DAILY_STATE_PREFIX = 'jee_sprint_daily_v1_';
const REVISION_KEY = 'jee_sprint_revision_v1';
const HISTORY_KEY = 'jee_sprint_history_v1';

export type PracticeMode = 'practice' | 'test';

export interface DailyProgressState {
  challengeDate: string;
  mode: PracticeMode;
  currentIndex: number;
  answers: Record<number, string>;
  submittedIds: number[];
  markedIds: number[];
  timeSpentByQuestion: Record<number, number>;
  totalElapsedSeconds: number;
  isCompleted: boolean;
  cachedQuestions: QuestionDTO[];
  isLimitedSet: boolean;
}

export interface RevisionItem {
  questionId: number;
  externalId: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  diagramSvg?: string | null;
  options: string[];
  optionExplanations?: string[];
  correctAnswer: string;
  numericalTolerance?: number;
  solution: string;
  conceptTested: string;
  formulaUsed: string;
  wrongAnswer: string;
  addedAt: string;
  lastReviewedAt: string;
  dueAt: string;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  mastered: boolean;
}

export interface DailyHistorySummary {
  challengeDate: string;
  attempted: number;
  correct: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export function getAnonymousSessionToken(): string {
  try {
    let token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'anon-session';
  }
}

export function getKolkataTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function loadDailyState(dateStr: string): DailyProgressState | null {
  try {
    const raw = localStorage.getItem(`${DAILY_STATE_PREFIX}${dateStr}`);
    if (!raw) return null;
    return JSON.parse(raw) as DailyProgressState;
  } catch {
    return null;
  }
}

export function saveDailyState(state: DailyProgressState): void {
  try {
    localStorage.setItem(`${DAILY_STATE_PREFIX}${state.challengeDate}`, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function loadRevisionList(): RevisionItem[] {
  try {
    const raw = localStorage.getItem(REVISION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRevisionList(items: RevisionItem[]): void {
  try {
    localStorage.setItem(REVISION_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota failure
  }
}

export function addMistakeToRevision(question: QuestionDTO, wrongAnswer: string): RevisionItem[] {
  const list = loadRevisionList();
  const now = new Date();
  const due = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day spaced repetition initial interval

  const existingIdx = list.findIndex((i) => i.questionId === question.id);
  const entry: RevisionItem = {
    questionId: question.id,
    externalId: question.externalId,
    subject: question.subject,
    chapter: question.chapter,
    topic: question.topic,
    difficulty: question.difficulty,
    questionType: question.questionType,
    questionText: question.questionText,
    diagramSvg: question.diagramSvg,
    options: question.options,
    optionExplanations: question.optionExplanations,
    correctAnswer: question.correctAnswer ?? '',
    numericalTolerance: question.numericalTolerance,
    solution: question.solution ?? '',
    conceptTested: question.conceptTested ?? question.topic,
    formulaUsed: question.formulaUsed ?? '',
    wrongAnswer,
    addedAt: existingIdx >= 0 ? list[existingIdx].addedAt : now.toISOString(),
    lastReviewedAt: now.toISOString(),
    dueAt: due.toISOString(),
    intervalDays: 1,
    repetitions: 0,
    easeFactor: 2.5,
    mastered: false,
  };

  const updated =
    existingIdx >= 0
      ? list.map((item, idx) => (idx === existingIdx ? entry : item))
      : [entry, ...list];

  saveRevisionList(updated);
  return updated;
}

export function recordRevisionAttempt(questionId: number, isCorrect: boolean): RevisionItem[] {
  const list = loadRevisionList();
  const now = new Date();

  const updated = list.map((item) => {
    if (item.questionId !== questionId) return item;

    let nextInterval = 1;
    let nextReps = item.repetitions;
    let nextEase = item.easeFactor;

    if (isCorrect) {
      nextReps += 1;
      if (nextReps === 1) nextInterval = 1;
      else if (nextReps === 2) nextInterval = 3;
      else if (nextReps === 3) nextInterval = 7;
      else nextInterval = Math.round(item.intervalDays * nextEase);
      nextEase = Math.min(3.0, item.easeFactor + 0.1);
    } else {
      nextReps = 0;
      nextInterval = 1;
      nextEase = Math.max(1.3, item.easeFactor - 0.2);
    }

    const dueDate = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);
    return {
      ...item,
      lastReviewedAt: now.toISOString(),
      dueAt: dueDate.toISOString(),
      intervalDays: nextInterval,
      repetitions: nextReps,
      easeFactor: nextEase,
      mastered: isCorrect && nextReps >= 3,
    };
  });

  saveRevisionList(updated);
  return updated;
}

export function removeFromRevisionList(questionId: number): RevisionItem[] {
  const updated = loadRevisionList().filter((i) => i.questionId !== questionId);
  saveRevisionList(updated);
  return updated;
}

export function saveDailyHistorySummary(summary: DailyHistorySummary): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: DailyHistorySummary[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.challengeDate !== summary.challengeDate);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([summary, ...filtered].slice(0, 60)));
  } catch {
    // Ignore
  }
}

export function loadDailyHistory(): DailyHistorySummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as DailyHistorySummary[]) : [];
  } catch {
    return [];
  }
}

function cleanLatexForPdf(input: string): string {
  return (input || '')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\operatorname\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, 'x')
    .replace(/\\cdot/g, '*')
    .replace(/\\pi/g, 'pi')
    .replace(/\\theta/g, 'theta')
    .replace(/\\omega/g, 'omega')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\Delta/g, 'Delta ')
    .replace(/\\lambda/g, 'lambda')
    .replace(/\\mu/g, 'mu')
    .replace(/\\varepsilon_0/g, 'eps0')
    .replace(/\\to|\\rightarrow/g, '->')
    .replace(/\\implies/g, '=>')
    .replace(/\\le/g, '<=')
    .replace(/\\ge/g, '>=')
    .replace(/\\neq/g, '!=')
    .replace(/\\approx/g, '~')
    .replace(/\\circ/g, ' deg')
    .replace(/\\;|\\,|\\!/g, ' ')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function exportRevisionListPdf(items: RevisionItem[]): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('JEE SPRINT 2027 — Mistake Revision Sheet', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Generated on ${getKolkataTodayString()} (IST) · ${items.length} question(s)`,
    margin,
    y
  );
  y += 18;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  items.forEach((item, index) => {
    ensureSpace(120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(29, 78, 216);
    doc.text(
      `Q${index + 1}. ${item.subject} · ${item.chapter} (${item.difficulty})`,
      margin,
      y
    );
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const qLines = doc.splitTextToSize(cleanLatexForPdf(item.questionText), maxWidth);
    ensureSpace(qLines.length * 13 + 20);
    doc.text(qLines, margin, y);
    y += qLines.length * 13 + 6;

    if (item.options.length > 0) {
      item.options.forEach((opt, optIdx) => {
        const label = ['A', 'B', 'C', 'D'][optIdx];
        const optLines = doc.splitTextToSize(
          `${label}. ${cleanLatexForPdf(opt)}`,
          maxWidth - 12
        );
        ensureSpace(optLines.length * 12 + 4);
        doc.text(optLines, margin + 10, y);
        y += optLines.length * 12 + 2;
      });
      y += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(
      `Correct Answer: ${item.correctAnswer}   |   Your Answer: ${item.wrongAnswer || '—'}`,
      margin,
      y
    );
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const formulaLines = doc.splitTextToSize(
      `Concept: ${item.conceptTested}  |  Formula: ${cleanLatexForPdf(item.formulaUsed)}`,
      maxWidth
    );
    ensureSpace(formulaLines.length * 12 + 12);
    doc.text(formulaLines, margin, y);
    y += formulaLines.length * 12 + 4;

    const solLines = doc.splitTextToSize(
      `Solution: ${cleanLatexForPdf(item.solution)}`,
      maxWidth
    );
    ensureSpace(solLines.length * 12 + 20);
    doc.text(solLines, margin, y);
    y += solLines.length * 12 + 12;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  });

  doc.save(`jee-sprint-2027-revision-${getKolkataTodayString()}.pdf`);
}

import type { QuestionDTO } from '../shared/syllabus.ts';

export function evaluateAnswerLocal(
  question: Pick<QuestionDTO, 'questionType' | 'correctAnswer' | 'numericalTolerance'>,
  submitted: string
): boolean {
  const trimmed = submitted.trim();
  if (!trimmed || !question.correctAnswer) return false;

  if (question.questionType === 'Numerical') {
    const exp = Number(question.correctAnswer);
    const act = Number(trimmed);
    if (!Number.isFinite(exp) || !Number.isFinite(act)) return false;
    const tol = Math.max(0, question.numericalTolerance ?? 0.01);
    return Math.abs(act - exp) <= tol + 1e-9;
  }

  return trimmed.toUpperCase() === question.correctAnswer.trim().toUpperCase();
}

export function formatDurationSeconds(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import { evaluateAnswerLocal, formatDurationSeconds } from '../lib/evaluate.ts';
import type { DailyProgressState } from '../lib/storage.ts';
import type { SubjectName } from '../shared/syllabus.ts';
import { MathText } from './MathText.tsx';

interface ResultsViewProps {
  state: DailyProgressState;
  onReviewQuestion: (index: number) => void;
  onOpenRevision: () => void;
  onBackHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  state,
  onReviewQuestion,
  onOpenRevision,
  onBackHome,
}) => {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'unattempted' | 'marked'>('all');
  const questions = state.cachedQuestions;

  const metrics = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    const bySubject: Record<
      SubjectName,
      { total: number; attempted: number; correct: number; incorrect: number; timeSec: number }
    > = {
      Physics: { total: 0, attempted: 0, correct: 0, incorrect: 0, timeSec: 0 },
      Chemistry: { total: 0, attempted: 0, correct: 0, incorrect: 0, timeSec: 0 },
      Mathematics: { total: 0, attempted: 0, correct: 0, incorrect: 0, timeSec: 0 },
    };

    const byChapter = new Map<
      string,
      {
        subject: SubjectName;
        chapter: string;
        total: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        wrongConcepts: string[];
      }
    >();

    for (const q of questions) {
      const ans = state.answers[q.id]?.trim() ?? '';
      const qTime = state.timeSpentByQuestion[q.id] ?? 0;
      const subjEntry = bySubject[q.subject];
      subjEntry.total++;
      subjEntry.timeSec += qTime;

      const chapKey = `${q.subject}::${q.chapter}`;
      const chapEntry = byChapter.get(chapKey) ?? {
        subject: q.subject,
        chapter: q.chapter,
        total: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        wrongConcepts: [],
      };
      chapEntry.total++;

      if (!ans) {
        unattempted++;
        chapEntry.unattempted++;
      } else {
        attempted++;
        subjEntry.attempted++;
        const ok = evaluateAnswerLocal(q, ans);
        if (ok) {
          correct++;
          subjEntry.correct++;
          chapEntry.correct++;
        } else {
          incorrect++;
          subjEntry.incorrect++;
          chapEntry.incorrect++;
          if (q.conceptTested) chapEntry.wrongConcepts.push(q.conceptTested);
        }
      }

      byChapter.set(chapKey, chapEntry);
    }

    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    // Build concrete improvement opportunities from real mistakes
    const weakChapters = Array.from(byChapter.values())
      .filter((c) => c.incorrect > 0)
      .sort((a, b) => b.incorrect - a.incorrect);

    const improvementAdvice = weakChapters.slice(0, 4).map((wc) => {
      const uniqueConcepts = Array.from(new Set(wc.wrongConcepts)).slice(0, 2).join(' and ');
      return {
        subject: wc.subject,
        chapter: wc.chapter,
        message: `You answered ${wc.incorrect} out of ${wc.total} ${wc.chapter} (${wc.subject}) question${
          wc.total > 1 ? 's' : ''
        } incorrectly. Revise ${uniqueConcepts || wc.chapter} before attempting your next set.`,
      };
    });

    return {
      attempted,
      correct,
      incorrect,
      unattempted,
      accuracy,
      bySubject,
      chapters: Array.from(byChapter.values()),
      improvementAdvice,
    };
  }, [questions, state.answers, state.timeSpentByQuestion]);

  const filteredQuestions = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => {
        const ans = state.answers[q.id]?.trim() ?? '';
        if (filter === 'unattempted') return !ans;
        if (filter === 'incorrect') return Boolean(ans) && !evaluateAnswerLocal(q, ans);
        if (filter === 'marked') return state.markedIds.includes(q.id);
        return true;
      });
  }, [questions, state.answers, state.markedIds, filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Performance Summary · {state.challengeDate} (IST)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Daily Challenge Results
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenRevision}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Open Revision Queue</span>
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Attempted</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 mt-1">
            {metrics.attempted}/{questions.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Correct</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 mt-1">
            {metrics.correct}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Incorrect</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-red-700 mt-1">
            {metrics.incorrect}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Unattempted</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-700 mt-1">
            {metrics.unattempted}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Accuracy</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-blue-700 mt-1">
            {metrics.accuracy}%
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Time Spent</div>
          <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 mt-1">
            {formatDurationSeconds(state.totalElapsedSeconds)}
          </div>
        </div>
      </div>

      {/* Next Improvement Opportunity */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-900">
            Your next improvement opportunity
          </h2>
        </div>

        {metrics.improvementAdvice.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.improvementAdvice.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
              >
                <div className="text-xs font-semibold text-blue-700">
                  {item.subject} · {item.chapter}
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        ) : metrics.attempted === 0 ? (
          <p className="text-sm text-slate-600">
            Attempt questions in today’s daily set to generate chapter-specific diagnostic advice.
          </p>
        ) : (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            Zero incorrect responses in your attempted questions today. Focus next on completing any remaining unattempted items under timed conditions.
          </p>
        )}
      </section>

      {/* Subject & Chapter Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Subject-wise Accuracy</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 font-medium">Subject</th>
                  <th className="py-2 font-medium text-right">Correct</th>
                  <th className="py-2 font-medium text-right">Accuracy</th>
                  <th className="py-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((subj) => {
                  const s = metrics.bySubject[subj];
                  const acc = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
                  return (
                    <tr key={subj}>
                      <td className="py-3 font-medium text-slate-900">{subj}</td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-700">
                        {s.correct}/{s.total}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-blue-700">
                        {acc}%
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-600">
                        {formatDurationSeconds(s.timeSec)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Chapter-wise Performance</h2>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 border-b border-slate-200 sticky top-0 bg-white">
                <tr>
                  <th className="py-2 font-medium">Chapter</th>
                  <th className="py-2 font-medium text-right">Correct</th>
                  <th className="py-2 font-medium text-right">Wrong</th>
                  <th className="py-2 font-medium text-right">Skipped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.chapters.map((ch) => (
                  <tr key={`${ch.subject}-${ch.chapter}`}>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-slate-900">{ch.chapter}</div>
                      <div className="text-xs text-slate-500">{ch.subject}</div>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {ch.correct}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-red-700 font-medium">
                      {ch.incorrect}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-500">
                      {ch.unattempted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Question-by-Question Review */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Detailed Solutions Review</h2>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(
              [
                ['all', 'All'],
                ['incorrect', 'Incorrect'],
                ['unattempted', 'Unattempted'],
                ['marked', 'Saved for Review'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredQuestions.map(({ q, idx }) => {
            const ans = state.answers[q.id]?.trim() ?? '';
            const ok = ans ? evaluateAnswerLocal(q, ans) : false;
            return (
              <div key={q.id} className="py-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono font-semibold text-slate-900">Q{idx + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.chapter}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.difficulty}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {!ans ? (
                      <span className="text-xs font-medium text-slate-500">Unattempted</span>
                    ) : ok ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct ({ans})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>
                          Incorrect (Yours: {ans} · Key: {q.correctAnswer})
                        </span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onReviewQuestion(idx)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                    >
                      Open in Solver
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-900 leading-relaxed">
                  <MathText text={q.questionText} />
                </div>

                <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                  <div>
                    <strong className="text-slate-900">Solution:</strong>{' '}
                    <MathText text={q.solution || ''} />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Formula:</strong> <MathText text={q.formulaUsed || ''} /> ·{' '}
                    <strong>Concept:</strong> {q.conceptTested}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

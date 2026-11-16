import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { evaluateAnswerLocal } from '../lib/evaluate.ts';
import {
  exportRevisionListPdf,
  type RevisionItem,
} from '../lib/storage.ts';
import type { QuestionDTO, SubjectName } from '../shared/syllabus.ts';
import { MathText } from './MathText.tsx';

interface RevisionViewProps {
  items: RevisionItem[];
  onRecordAttempt: (questionId: number, isCorrect: boolean) => void;
  onRemoveItem: (questionId: number) => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  items,
  onRecordAttempt,
  onRemoveItem,
}) => {
  const [statusFilter, setStatusFilter] = useState<'due' | 'all' | 'mastered'>('all');
  const [subjectFilter, setSubjectFilter] = useState<'All' | SubjectName>('All');
  const [activeRetryId, setActiveRetryId] = useState<number | null>(null);
  const [retryInput, setRetryInput] = useState('');
  const [retrySubmitted, setRetrySubmitted] = useState(false);
  const [similarDrawer, setSimilarDrawer] = useState<{
    sourceItem: RevisionItem;
    loading: boolean;
    questions: QuestionDTO[];
    idx: number;
    draft: string;
    checked: boolean;
  } | null>(null);

  const nowMs = Date.now();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (subjectFilter !== 'All' && item.subject !== subjectFilter) return false;
      if (statusFilter === 'mastered') return item.mastered;
      if (statusFilter === 'due') {
        return !item.mastered && new Date(item.dueAt).getTime() <= nowMs;
      }
      return true;
    });
  }, [items, statusFilter, subjectFilter, nowMs]);

  const dueCount = items.filter(
    (i) => !i.mastered && new Date(i.dueAt).getTime() <= nowMs
  ).length;

  const openRetry = (item: RevisionItem) => {
    setActiveRetryId(item.questionId);
    setRetryInput('');
    setRetrySubmitted(false);
  };

  const submitRetry = (item: RevisionItem) => {
    if (!retryInput.trim()) return;
    const isCorrect = evaluateAnswerLocal(
      {
        questionType: item.questionType as QuestionDTO['questionType'],
        correctAnswer: item.correctAnswer,
        numericalTolerance: item.numericalTolerance,
      },
      retryInput
    );
    setRetrySubmitted(true);
    onRecordAttempt(item.questionId, isCorrect);
  };

  const openSimilar = async (item: RevisionItem) => {
    setSimilarDrawer({
      sourceItem: item,
      loading: true,
      questions: [],
      idx: 0,
      draft: '',
      checked: false,
    });
    try {
      const res = await fetch(
        `/api/questions/similar?subject=${encodeURIComponent(
          item.subject
        )}&chapter=${encodeURIComponent(item.chapter)}&excludeIds=${item.questionId}&limit=4`
      );
      const data = await res.json();
      setSimilarDrawer({
        sourceItem: item,
        loading: false,
        questions: data.questions ?? [],
        idx: 0,
        draft: '',
        checked: false,
      });
    } catch {
      setSimilarDrawer({
        sourceItem: item,
        loading: false,
        questions: [],
        idx: 0,
        draft: '',
        checked: false,
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Zero-login local spaced repetition · {dueCount} due now · {items.length} total saved
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Mistake Revision Engine
          </h1>
        </div>

        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => exportRevisionListPdf(filtered.length > 0 ? filtered : items)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Export Revision List (PDF)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          {(
            [
              ['all', `All (${items.length})`],
              ['due', `Due Now (${dueCount})`],
              ['mastered', 'Mastered'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          {(['All', 'Physics', 'Chemistry', 'Mathematics'] as const).map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => setSubjectFilter(subj)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                subjectFilter === subj
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Revision List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <h2 className="text-base font-semibold text-slate-900">
            {items.length === 0
              ? 'No mistakes recorded yet'
              : 'No revision items match this filter'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Whenever you answer a question incorrectly in the Daily Challenge, it is automatically scheduled here using spaced repetition intervals (1d, 3d, 7d+).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isRetrying = activeRetryId === item.questionId;
            const dueDate = new Date(item.dueAt);
            const isDue = !item.mastered && dueDate.getTime() <= nowMs;
            const retryCorrect = retrySubmitted
              ? evaluateAnswerLocal(
                  {
                    questionType: item.questionType as QuestionDTO['questionType'],
                    correctAnswer: item.correctAnswer,
                    numericalTolerance: item.numericalTolerance,
                  },
                  retryInput
                )
              : false;

            return (
              <div
                key={item.questionId}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="text-xs sm:text-sm text-slate-600">
                    <span className="font-semibold text-blue-700">{item.subject}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-medium text-slate-900">{item.chapter}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{item.conceptTested}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                    <span
                      className={
                        item.mastered
                          ? 'text-emerald-700 font-semibold'
                          : isDue
                          ? 'text-amber-700 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      {item.mastered
                        ? 'Mastered'
                        : isDue
                        ? 'Due for re-attempt'
                        : `Next review: ${dueDate.toLocaleDateString('en-IN')}`}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">Interval {item.intervalDays}d</span>
                  </div>
                </div>

                <div className="text-sm sm:text-base text-slate-900 leading-relaxed">
                  <MathText text={item.questionText} />
                </div>

                <div className="text-xs text-slate-600">
                  Formula: <MathText text={item.formulaUsed} />
                </div>

                {isRetrying ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    {item.questionType === 'Numerical' ? (
                      <input
                        type="text"
                        value={retryInput}
                        disabled={retrySubmitted}
                        onChange={(e) => setRetryInput(e.target.value)}
                        placeholder="Enter numerical answer"
                        className="w-48 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm bg-white"
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.options.map((opt, idx) => {
                          const letter = ['A', 'B', 'C', 'D'][idx];
                          const picked = retryInput === letter;
                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={retrySubmitted}
                              onClick={() => setRetryInput(letter)}
                              className={`text-left p-2.5 rounded-lg border text-sm flex items-start gap-2 cursor-pointer ${
                                picked
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-mono font-semibold">{letter}.</span>
                              <MathText text={opt} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!retrySubmitted ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!retryInput.trim()}
                          onClick={() => submitRetry(item)}
                          className="px-4 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          Submit Re-attempt
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveRetryId(null)}
                          className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                          {retryCorrect ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Correct — next review interval extended!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-700">
                              <XCircle className="w-4 h-4" />
                              <span>
                                Incorrect (Answer: {item.correctAnswer}) — interval reset to 1 day.
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-700 text-xs sm:text-sm">
                          <MathText text={item.solution} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openRetry(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-attempt Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openSimilar(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                        <span>Similar Question</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.questionId)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Similar Questions Modal */}
      {similarDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs text-slate-500">
                  {similarDrawer.sourceItem.subject} · {similarDrawer.sourceItem.chapter}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Recommended Similar Practice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSimilarDrawer(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {similarDrawer.loading ? (
              <p className="text-sm text-slate-600 py-4">Loading similar problems...</p>
            ) : similarDrawer.questions.length === 0 ? (
              <p className="text-sm text-slate-600 py-4">
                No other published problems found in this chapter yet.
              </p>
            ) : (
              (() => {
                const q = similarDrawer.questions[similarDrawer.idx];
                const ok = similarDrawer.checked
                  ? evaluateAnswerLocal(q, similarDrawer.draft)
                  : false;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Question {similarDrawer.idx + 1} of {similarDrawer.questions.length} ·{' '}
                        {q.difficulty}
                      </span>
                      {similarDrawer.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSimilarDrawer((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    idx: (prev.idx + 1) % prev.questions.length,
                                    draft: '',
                                    checked: false,
                                  }
                                : null
                            )
                          }
                          className="font-semibold text-blue-700 cursor-pointer"
                        >
                          Next Question
                        </button>
                      )}
                    </div>

                    <div className="text-base text-slate-900">
                      <MathText text={q.questionText} />
                    </div>

                    {q.questionType === 'Numerical' ? (
                      <input
                        type="text"
                        value={similarDrawer.draft}
                        disabled={similarDrawer.checked}
                        onChange={(e) =>
                          setSimilarDrawer((prev) =>
                            prev ? { ...prev, draft: e.target.value } : null
                          )
                        }
                        placeholder="Numerical answer"
                        className="w-48 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    ) : (
                      <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                          const letter = ['A', 'B', 'C', 'D'][idx];
                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={similarDrawer.checked}
                              onClick={() =>
                                setSimilarDrawer((prev) =>
                                  prev ? { ...prev, draft: letter } : null
                                )
                              }
                              className={`w-full text-left p-3 rounded-lg border text-sm flex items-start gap-2 cursor-pointer ${
                                similarDrawer.draft === letter
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-mono font-semibold">{letter}.</span>
                              <MathText text={opt} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!similarDrawer.checked ? (
                      <button
                        type="button"
                        disabled={!similarDrawer.draft.trim()}
                        onClick={() =>
                          setSimilarDrawer((prev) =>
                            prev ? { ...prev, checked: true } : null
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Verify Answer
                      </button>
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-2">
                        <div className="font-semibold">
                          {ok ? (
                            <span className="text-emerald-700">Correct!</span>
                          ) : (
                            <span className="text-red-700">
                              Incorrect — Answer: {q.correctAnswer}
                            </span>
                          )}
                        </div>
                        <MathText text={q.solution || ''} />
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};

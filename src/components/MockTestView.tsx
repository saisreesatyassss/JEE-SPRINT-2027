import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Clock,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import { formatDurationSeconds } from '../lib/evaluate.ts';
import { getAnonymousSessionToken } from '../lib/storage.ts';
import type { QuestionDTO, SubjectName } from '../shared/syllabus.ts';
import { MathText } from './MathText.tsx';

interface MockTestMeta {
  id: number;
  slug: string;
  title: string;
  patternStatus: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
    numericalNegativeMarking: boolean;
    sectionARules: string;
    sectionBRules: string;
  };
}

interface MockSubmissionResult {
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  subjectBreakdown: Record<
    string,
    { score: number; correct: number; incorrect: number; unattempted: number }
  >;
  questionResults: Array<{
    questionId: number;
    subject: string;
    chapter: string;
    submittedAnswer: string;
    correctAnswer: string;
    status: 'correct' | 'incorrect' | 'unattempted';
    marksAwarded: number;
  }>;
}

export const MockTestView: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {
  const [tests, setTests] = useState<MockTestMeta[]>([]);
  const [patternMeta, setPatternMeta] = useState<{
    patternStatus: string;
    disclaimer: string;
  } | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [activeTest, setActiveTest] = useState<{
    meta: MockTestMeta;
    questions: QuestionDTO[];
  } | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedIds, setMarkedIds] = useState<number[]>([]);
  const [visitedIds, setVisitedIds] = useState<number[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(180 * 60);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<MockSubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/mock-tests')
      .then((r) => r.json())
      .then((data) => {
        setTests(data.mockTests ?? []);
        if (data.examPattern) {
          setPatternMeta({
            patternStatus: data.examPattern.patternStatus,
            disclaimer: data.examPattern.disclaimer,
          });
        }
      })
      .catch(() => setError('Unable to load mock tests right now.'))
      .finally(() => setLoadingList(false));
  }, []);

  // Countdown timer when active
  useEffect(() => {
    if (!activeTest || result) return;
    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          void handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeTest?.meta.id, result]);

  const startMockTest = async (testId: number) => {
    setError(null);
    try {
      const res = await fetch(`/api/mock-tests/${testId}`);
      if (!res.ok) throw new Error('Failed to load mock paper');
      const data = await res.json();
      const qs: QuestionDTO[] = data.questions ?? [];
      setActiveTest({ meta: data.mockTest, questions: qs });
      setCurrentIdx(0);
      setAnswers({});
      setMarkedIds([]);
      setVisitedIds(qs[0] ? [qs[0].id] : []);
      setRemainingSeconds((data.mockTest.durationMinutes || 180) * 60);
      setResult(null);
    } catch {
      setError('Failed to initialize mock test paper.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!activeTest || submitting) return;
    setSubmitting(true);
    setConfirmSubmit(false);
    try {
      const totalDuration = activeTest.meta.durationMinutes * 60;
      const res = await fetch(`/api/mock-tests/${activeTest.meta.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: getAnonymousSessionToken(),
          answers,
          timeSpentSeconds: Math.max(0, totalDuration - remainingSeconds),
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = activeTest?.questions[currentIdx];

  const jumpToQuestion = (idx: number) => {
    if (!activeTest) return;
    const q = activeTest.questions[idx];
    if (q && !visitedIds.includes(q.id)) {
      setVisitedIds((prev) => [...prev, q.id]);
    }
    setCurrentIdx(idx);
  };

  const jumpToSubject = (subj: SubjectName) => {
    if (!activeTest) return;
    const firstIdx = activeTest.questions.findIndex((q) => q.subject === subj);
    if (firstIdx >= 0) jumpToQuestion(firstIdx);
  };

  const subjectIndices = useMemo(() => {
    if (!activeTest) return { Physics: [], Chemistry: [], Mathematics: [] };
    const map: Record<SubjectName, Array<{ q: QuestionDTO; idx: number }>> = {
      Physics: [],
      Chemistry: [],
      Mathematics: [],
    };
    activeTest.questions.forEach((q, idx) => {
      map[q.subject]?.push({ q, idx });
    });
    return map;
  }, [activeTest]);

  // 1. Mock Test Selector Screen
  if (!activeTest) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              NTA Computer-Based Test Simulation
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              JEE Main 2027 Full Mock Tests
            </h1>
          </div>
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Back to Home
          </button>
        </div>

        {patternMeta && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3.5 text-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">
                Pattern Notice: {patternMeta.patternStatus}
              </div>
              <p className="text-amber-900/90 leading-relaxed">{patternMeta.disclaimer}</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loadingList ? (
          <p className="text-sm text-slate-600">Loading mock test papers...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="text-xs font-medium text-blue-700">
                    {test.patternStatus}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{test.title}</h2>
                  <dl className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Questions</dt>
                      <dd className="font-mono tabular-nums font-semibold text-slate-900">
                        {test.totalQuestions}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Max Marks</dt>
                      <dd className="font-mono tabular-nums font-semibold text-slate-900">
                        {test.totalMarks}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Duration</dt>
                      <dd className="font-mono tabular-nums font-semibold text-slate-900">
                        {test.durationMinutes} min
                      </dd>
                    </div>
                  </dl>
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div>Section A (20/subject): {test.markingScheme.sectionARules}</div>
                    <div>Section B (5/subject): {test.markingScheme.sectionBRules}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startMockTest(test.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Start Exam Simulation</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Post-Mock Scorecard Screen
  if (result) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              {activeTest.meta.title} · {activeTest.meta.patternStatus}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Mock Test Scorecard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTest(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              All Mock Tests
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Total Score</div>
            <div className="text-3xl font-mono tabular-nums font-bold text-blue-700 mt-1">
              {result.score} / {result.maxScore}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Correct (+4)</div>
            <div className="text-3xl font-mono tabular-nums font-bold text-emerald-700 mt-1">
              {result.correctCount}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Incorrect (-1)</div>
            <div className="text-3xl font-mono tabular-nums font-bold text-red-700 mt-1">
              {result.incorrectCount}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs text-slate-500">Unattempted (0)</div>
            <div className="text-3xl font-mono tabular-nums font-bold text-slate-700 mt-1">
              {result.unattemptedCount}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Subject-wise Marks Breakdown</h2>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 font-medium">Subject</th>
                <th className="py-2 font-medium text-right">Score</th>
                <th className="py-2 font-medium text-right">Correct</th>
                <th className="py-2 font-medium text-right">Incorrect</th>
                <th className="py-2 font-medium text-right">Unattempted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((subj) => {
                const row = result.subjectBreakdown[subj];
                return (
                  <tr key={subj}>
                    <td className="py-3 font-semibold text-slate-900">{subj}</td>
                    <td className="py-3 text-right font-mono tabular-nums font-bold text-blue-700">
                      {row?.score ?? 0}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-emerald-700">
                      {row?.correct ?? 0}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-red-700">
                      {row?.incorrect ?? 0}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-500">
                      {row?.unattempted ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Question-by-Question Review</h2>
          <div className="divide-y divide-slate-100">
            {activeTest.questions.map((q, idx) => {
              const r = result.questionResults.find((x) => x.questionId === q.id);
              return (
                <div key={q.id} className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-900">
                      Q{idx + 1} · {q.subject} · {q.chapter} · {q.questionType}
                    </span>
                    {r?.status === 'correct' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+4 · Key: {r.correctAnswer}</span>
                      </span>
                    ) : r?.status === 'incorrect' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>
                          -1 · Yours: {r.submittedAnswer} · Key: {r.correctAnswer}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        0 · Unattempted · Key: {r?.correctAnswer}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-900">
                    <MathText text={q.questionText} />
                  </div>
                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <strong>Solution:</strong> <MathText text={q.solution || ''} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. Active NTA CBT Simulator Interface
  const currentAns = currentQ ? answers[currentQ.id] ?? '' : '';
  const currentMarked = currentQ ? markedIds.includes(currentQ.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 space-y-5">
      {/* Top CBT Header */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]).map((subj) => {
            const active = currentQ?.subject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => jumpToSubject(subj)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {subj} ({subjectIndices[subj].length})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono tabular-nums text-sm font-semibold">
            <Clock className="w-4 h-4 text-slate-300" />
            <span>{formatDurationSeconds(remainingSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmSubmit(true)}
            className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 cursor-pointer whitespace-nowrap"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main CBT Grid */}
      {currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 text-xs sm:text-sm text-slate-600">
              <div>
                <strong className="font-mono text-slate-900">
                  Q{currentIdx + 1} / {activeTest.questions.length}
                </strong>{' '}
                · {currentQ.subject} ·{' '}
                {currentQ.questionType === 'Numerical'
                  ? 'Section B (Numerical)'
                  : 'Section A (MCQ)'}{' '}
                · +4 / -1
              </div>
              <div className="text-xs text-slate-500">{currentQ.chapter}</div>
            </div>

            <div className="text-base text-slate-900 leading-relaxed">
              <MathText text={currentQ.questionText} />
            </div>

            {currentQ.diagramSvg && (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-center"
                dangerouslySetInnerHTML={{ __html: currentQ.diagramSvg }}
              />
            )}

            {currentQ.questionType === 'Numerical' ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Numerical Response (negative marking -1 applies for wrong value)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentAns}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^-?\d*\.?\d*$/.test(val)) return;
                    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                  }}
                  placeholder="Enter numeric value"
                  className="w-56 px-4 py-2.5 border border-slate-300 rounded-lg font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx];
                  const selected = currentAns === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [currentQ.id]: letter }))
                      }
                      className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50 text-slate-900'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-md font-mono text-xs font-semibold flex items-center justify-center shrink-0 border ${
                          selected
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base pt-0.5">
                        <MathText text={opt} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* CBT Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => {
                      const next = { ...prev };
                      delete next[currentQ.id];
                      return next;
                    })
                  }
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Clear Response
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMarkedIds((prev) =>
                      prev.includes(currentQ.id) ? prev : [...prev, currentQ.id]
                    );
                    if (currentIdx < activeTest.questions.length - 1) {
                      jumpToQuestion(currentIdx + 1);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-xs sm:text-sm font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>
                    {currentMarked ? 'Marked · Next' : 'Mark for Review & Next'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (currentIdx < activeTest.questions.length - 1) {
                    jumpToQuestion(currentIdx + 1);
                  }
                }}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap"
              >
                Save & Next
              </button>
            </div>
          </div>

          {/* Right CBT Palette */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              {currentQ.subject} Palette
            </div>

            <div className="grid grid-cols-5 gap-2">
              {subjectIndices[currentQ.subject].map(({ q, idx }) => {
                const answered = Boolean(answers[q.id]?.trim());
                const marked = markedIds.includes(q.id);
                const visited = visitedIds.includes(q.id);
                const isCurr = idx === currentIdx;

                let cls = 'bg-slate-50 border-slate-200 text-slate-600';
                if (answered && marked) {
                  cls = 'bg-indigo-50 border-indigo-500 text-indigo-900';
                } else if (marked) {
                  cls = 'bg-amber-50 border-amber-400 text-amber-900';
                } else if (answered) {
                  cls = 'bg-emerald-50 border-emerald-500 text-emerald-800';
                } else if (visited) {
                  cls = 'bg-red-50 border-red-300 text-red-800';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => jumpToQuestion(idx)}
                    className={`h-9 rounded-lg border font-mono tabular-nums text-xs font-semibold cursor-pointer ${cls} ${
                      isCurr ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-500 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-red-50 border border-red-300 inline-block" />
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-400 inline-block" />
                <span>Marked Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-indigo-50 border border-indigo-500 inline-block" />
                <span>Answered + Marked</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Submit Mock Test?</h3>
            <p className="text-sm text-slate-600">
              You have answered{' '}
              <strong className="font-mono text-slate-900">
                {Object.values(answers).filter((v) => v.trim()).length}
              </strong>{' '}
              out of{' '}
              <strong className="font-mono text-slate-900">
                {activeTest.questions.length}
              </strong>{' '}
              questions. Once submitted, your score (+4/-1) will be calculated immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 cursor-pointer"
              >
                {submitting ? 'Grading...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

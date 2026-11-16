import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { evaluateAnswerLocal, formatDurationSeconds } from '../lib/evaluate.ts';
import type { DailyProgressState, PracticeMode } from '../lib/storage.ts';
import type { QuestionDTO, SubjectName } from '../shared/syllabus.ts';
import { MathText } from './MathText.tsx';

interface DailyChallengeViewProps {
  state: DailyProgressState;
  onUpdateState: (updater: (prev: DailyProgressState) => DailyProgressState) => void;
  onSubmitQuestionAttempt: (question: QuestionDTO, answer: string, isCorrect: boolean) => void;
  onFinishChallenge: () => void;
  onBackHome: () => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  state,
  onUpdateState,
  onSubmitQuestionAttempt,
  onFinishChallenge,
  onBackHome,
}) => {
  const questions = state.cachedQuestions;
  const currentQ = questions[state.currentIndex];
  const [similarModal, setSimilarModal] = useState<{
    loading: boolean;
    questions: QuestionDTO[];
    selectedIdx: number;
    draftAnswer: string;
    submitted: boolean;
  } | null>(null);

  // Elapsed timer tick
  useEffect(() => {
    if (state.isCompleted || !currentQ) return;
    const timer = window.setInterval(() => {
      onUpdateState((prev) => ({
        ...prev,
        totalElapsedSeconds: prev.totalElapsedSeconds + 1,
        timeSpentByQuestion: {
          ...prev.timeSpentByQuestion,
          [currentQ.id]: (prev.timeSpentByQuestion[currentQ.id] ?? 0) + 1,
        },
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.isCompleted, currentQ?.id]);

  if (!currentQ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
        <p className="text-slate-700">No daily questions available right now.</p>
        <button
          type="button"
          onClick={onBackHome}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const currentAnswer = state.answers[currentQ.id] ?? '';
  const isSubmitted = state.submittedIds.includes(currentQ.id) || state.isCompleted;
  const isMarked = state.markedIds.includes(currentQ.id);
  const isCorrect = isSubmitted ? evaluateAnswerLocal(currentQ, currentAnswer) : false;
  const showExplanation =
    isSubmitted && (state.mode === 'practice' || state.isCompleted);

  const handleSelectOption = (optionLetter: string) => {
    if (isSubmitted && state.mode === 'practice') return;
    if (state.isCompleted) return;
    onUpdateState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQ.id]: optionLetter,
      },
    }));
  };

  const handleNumericalChange = (val: string) => {
    if (isSubmitted && state.mode === 'practice') return;
    if (state.isCompleted) return;
    if (!/^-?\d*\.?\d*$/.test(val)) return;
    onUpdateState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQ.id]: val,
      },
    }));
  };

  const handleToggleMark = () => {
    onUpdateState((prev) => {
      const exists = prev.markedIds.includes(currentQ.id);
      return {
        ...prev,
        markedIds: exists
          ? prev.markedIds.filter((id) => id !== currentQ.id)
          : [...prev.markedIds, currentQ.id],
      };
    });
  };

  const handleSubmitCurrent = () => {
    if (!currentAnswer.trim()) return;
    const correct = evaluateAnswerLocal(currentQ, currentAnswer);
    onUpdateState((prev) => ({
      ...prev,
      submittedIds: prev.submittedIds.includes(currentQ.id)
        ? prev.submittedIds
        : [...prev.submittedIds, currentQ.id],
    }));
    onSubmitQuestionAttempt(currentQ, currentAnswer, correct);
  };

  const handleClearCurrent = () => {
    if (isSubmitted && state.mode === 'practice') return;
    onUpdateState((prev) => {
      const nextAns = { ...prev.answers };
      delete nextAns[currentQ.id];
      return {
        ...prev,
        answers: nextAns,
        submittedIds: prev.submittedIds.filter((id) => id !== currentQ.id),
      };
    });
  };

  const handleModeChange = (mode: PracticeMode) => {
    if (state.isCompleted) return;
    onUpdateState((prev) => ({ ...prev, mode }));
  };

  const openSimilarQuestions = async () => {
    setSimilarModal({
      loading: true,
      questions: [],
      selectedIdx: 0,
      draftAnswer: '',
      submitted: false,
    });
    try {
      const exclude = questions.map((q) => q.id).join(',');
      const res = await fetch(
        `/api/questions/similar?subject=${encodeURIComponent(
          currentQ.subject
        )}&chapter=${encodeURIComponent(currentQ.chapter)}&excludeIds=${exclude}&limit=4`
      );
      const data = await res.json();
      setSimilarModal({
        loading: false,
        questions: data.questions ?? [],
        selectedIdx: 0,
        draftAnswer: '',
        submitted: false,
      });
    } catch {
      setSimilarModal({
        loading: false,
        questions: [],
        selectedIdx: 0,
        draftAnswer: '',
        submitted: false,
      });
    }
  };

  const subjects: SubjectName[] = ['Physics', 'Chemistry', 'Mathematics'];
  const answeredCount = questions.filter((q) => Boolean(state.answers[q.id]?.trim())).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Sub-header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-slate-900">
            Daily Challenge · {state.challengeDate}
          </span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-slate-600">
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!state.isCompleted && (
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleModeChange('practice')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                  state.mode === 'practice'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Practice Mode
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('test')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
                  state.mode === 'test'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Test Mode
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 text-sm font-mono tabular-nums text-slate-700 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDurationSeconds(state.totalElapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={onFinishChallenge}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {state.isCompleted ? 'View Results' : 'Finish & View Results'}
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Card */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            {/* Zero-pill metadata row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  Question {String(state.currentIndex + 1).padStart(2, '0')} of {questions.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-blue-700">{currentQ.subject}</span>
                <span aria-hidden="true">·</span>
                <span>{currentQ.chapter}</span>
                <span aria-hidden="true">·</span>
                <span>{currentQ.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span>{currentQ.questionType}</span>
              </div>

              <button
                type="button"
                onClick={handleToggleMark}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  isMarked
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isMarked ? 'Saved for Review' : 'Save for Review'}</span>
              </button>
            </div>

            {/* Question Statement */}
            <div className="text-base sm:text-[17px] leading-relaxed text-slate-900">
              <MathText text={currentQ.questionText} />
            </div>

            {/* Optional SVG Diagram */}
            {currentQ.diagramSvg && (
              <div
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-center"
                dangerouslySetInnerHTML={{ __html: currentQ.diagramSvg }}
              />
            )}

            {/* Answer Input: MCQ vs Numerical */}
            {currentQ.questionType === 'Numerical' ? (
              <div className="space-y-3 pt-2">
                <label
                  htmlFor="numerical-input"
                  className="block text-xs font-medium text-slate-600"
                >
                  Enter exact numerical value (integers or decimals accepted within tolerance)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="numerical-input"
                    type="text"
                    inputMode="decimal"
                    value={currentAnswer}
                    disabled={isSubmitted && state.mode === 'practice'}
                    onChange={(e) => handleNumericalChange(e.target.value)}
                    placeholder="e.g. 48 or 2.5"
                    className="w-56 px-4 py-2.5 font-mono tabular-nums text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-slate-100"
                  />
                  {!isSubmitted && currentAnswer && (
                    <button
                      type="button"
                      onClick={handleClearCurrent}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {currentQ.options.map((optText, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx];
                  const isSelected = currentAnswer.toUpperCase() === letter;
                  const isRightOpt =
                    showExplanation &&
                    currentQ.correctAnswer?.toUpperCase() === letter;
                  const isWrongSelected =
                    showExplanation && isSelected && !isRightOpt;

                  let cardCls =
                    'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800';
                  if (isRightOpt) {
                    cardCls = 'border-emerald-500 bg-emerald-50/70 text-emerald-950';
                  } else if (isWrongSelected) {
                    cardCls = 'border-red-400 bg-red-50/70 text-red-950';
                  } else if (isSelected) {
                    cardCls = 'border-blue-600 bg-blue-50/70 text-slate-900';
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleSelectOption(letter)}
                      disabled={isSubmitted && state.mode === 'practice'}
                      className={`w-full text-left flex items-start gap-3.5 p-4 rounded-xl border transition-colors cursor-pointer disabled:cursor-default ${cardCls}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-md font-mono text-xs font-semibold flex items-center justify-center shrink-0 border ${
                          isRightOpt
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isWrongSelected
                            ? 'bg-red-600 text-white border-red-600'
                            : isSelected
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base leading-relaxed pt-0.5 flex-1">
                        <MathText text={optText} />
                      </span>
                      {isRightOpt && (
                        <span className="text-xs font-semibold text-emerald-700 shrink-0 self-center">
                          Correct
                        </span>
                      )}
                      {isWrongSelected && (
                        <span className="text-xs font-semibold text-red-700 shrink-0 self-center">
                          Your Pick
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={state.currentIndex === 0}
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      currentIndex: Math.max(0, prev.currentIndex - 1),
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={state.currentIndex >= questions.length - 1}
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      currentIndex: Math.min(questions.length - 1, prev.currentIndex + 1),
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {!isSubmitted && state.mode === 'practice' && (
                  <button
                    type="button"
                    disabled={!currentAnswer.trim()}
                    onClick={handleSubmitCurrent}
                    className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    Submit Answer
                  </button>
                )}

                {!isSubmitted && state.mode === 'test' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentAnswer.trim()) {
                        handleSubmitCurrent();
                      }
                      if (state.currentIndex < questions.length - 1) {
                        onUpdateState((prev) => ({
                          ...prev,
                          currentIndex: prev.currentIndex + 1,
                        }));
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap"
                  >
                    Save & Next
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Post-Submission Explanation Panel */}
          {showExplanation && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-base font-bold text-emerald-800">
                        Correct Answer
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      <span className="text-base font-bold text-red-800">
                        {currentAnswer.trim() ? 'Incorrect Answer' : 'Unattempted'}
                      </span>
                    </>
                  )}
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-sm text-slate-700">
                    Answer Key:{' '}
                    <strong className="font-mono text-slate-900">
                      {currentQ.correctAnswer}
                    </strong>
                    {currentQ.questionType === 'Numerical' &&
                      currentQ.numericalTolerance !== undefined && (
                        <span className="text-xs text-slate-500 ml-1">
                          (±{currentQ.numericalTolerance})
                        </span>
                      )}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Source:{' '}
                  <span className="font-medium text-slate-700">
                    {currentQ.sourceType === 'OfficialPYQ'
                      ? `Official PYQ (${currentQ.sourceReference || 'NTA Archive'})`
                      : 'Original Curated Problem'}
                  </span>
                </div>
              </div>

              {!isCorrect && currentAnswer.trim() && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs sm:text-sm text-amber-900">
                  <span>
                    Saved automatically to your Spaced Repetition Revision Queue for follow-up review.
                  </span>
                  <button
                    type="button"
                    onClick={openSimilarQuestions}
                    className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Practice Similar Question</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="text-xs font-medium text-slate-500 mb-1">Concept Tested</div>
                  <div className="font-medium text-slate-900">{currentQ.conceptTested}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="text-xs font-medium text-slate-500 mb-1">Key Formula / Principle</div>
                  <div className="text-slate-900">
                    <MathText text={currentQ.formulaUsed || ''} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Complete Solution
                </div>
                <div className="text-sm sm:text-[15px] leading-relaxed text-slate-800">
                  <MathText text={currentQ.solution || ''} />
                </div>
              </div>

              {currentQ.optionExplanations && currentQ.optionExplanations.length === 4 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Option-by-Option Analysis
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {currentQ.optionExplanations.map((exp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono font-semibold text-slate-900 w-5 shrink-0">
                          {['A', 'B', 'C', 'D'][i]}.
                        </span>
                        <span>
                          <MathText text={exp} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Question Palette */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Question Palette</h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="space-y-4">
            {subjects.map((subj) => {
              const subjItems = questions
                .map((q, idx) => ({ q, idx }))
                .filter((item) => item.q.subject === subj);
              if (subjItems.length === 0) return null;

              return (
                <div key={subj} className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">{subj}</div>
                  <div className="grid grid-cols-5 gap-2">
                    {subjItems.map(({ q, idx }) => {
                      const isCurrent = idx === state.currentIndex;
                      const ans = state.answers[q.id]?.trim();
                      const submitted = state.submittedIds.includes(q.id) || state.isCompleted;
                      const marked = state.markedIds.includes(q.id);
                      const showVerdict =
                        submitted && (state.mode === 'practice' || state.isCompleted);
                      const right = showVerdict && evaluateAnswerLocal(q, ans ?? '');

                      let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                      if (showVerdict) {
                        btnStyle = !ans
                          ? 'bg-slate-100 border-slate-300 text-slate-600'
                          : right
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-red-50 border-red-400 text-red-800';
                      } else if (marked) {
                        btnStyle = 'bg-amber-50 border-amber-400 text-amber-900';
                      } else if (ans) {
                        btnStyle = 'bg-blue-50 border-blue-500 text-blue-900';
                      }

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() =>
                            onUpdateState((prev) => ({ ...prev, currentIndex: idx }))
                          }
                          className={`h-9 rounded-lg border font-mono tabular-nums text-xs font-semibold transition-colors cursor-pointer ${btnStyle} ${
                            isCurrent ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-500 inline-block" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-400 inline-block" />
              <span>Saved for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-500 inline-block" />
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-red-50 border border-red-400 inline-block" />
              <span>Incorrect</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar Questions Modal */}
      {similarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Similar Practice · {currentQ.subject} · {currentQ.chapter}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Reinforce This Concept
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSimilarModal(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close similar practice"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {similarModal.loading ? (
              <p className="text-sm text-slate-600 py-6">
                Finding approved questions in {currentQ.chapter}...
              </p>
            ) : similarModal.questions.length === 0 ? (
              <p className="text-sm text-slate-600 py-6">
                No additional unseen questions found in this chapter right now. Check the Revision Queue for scheduled practice.
              </p>
            ) : (
              (() => {
                const simQ = similarModal.questions[similarModal.selectedIdx];
                const simCorrect = similarModal.submitted
                  ? evaluateAnswerLocal(simQ, similarModal.draftAnswer)
                  : false;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Similar Question {similarModal.selectedIdx + 1} of{' '}
                        {similarModal.questions.length} · {simQ.difficulty}
                      </span>
                      {similarModal.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSimilarModal((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    selectedIdx:
                                      (prev.selectedIdx + 1) % prev.questions.length,
                                    draftAnswer: '',
                                    submitted: false,
                                  }
                                : null
                            )
                          }
                          className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                        >
                          <span>Next Similar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="text-base text-slate-900 leading-relaxed">
                      <MathText text={simQ.questionText} />
                    </div>

                    {simQ.questionType === 'Numerical' ? (
                      <input
                        type="text"
                        value={similarModal.draftAnswer}
                        disabled={similarModal.submitted}
                        onChange={(e) =>
                          setSimilarModal((prev) =>
                            prev ? { ...prev, draftAnswer: e.target.value } : null
                          )
                        }
                        placeholder="Enter numerical answer"
                        className="w-48 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                      />
                    ) : (
                      <div className="space-y-2">
                        {simQ.options.map((opt, i) => {
                          const letter = ['A', 'B', 'C', 'D'][i];
                          const picked = similarModal.draftAnswer === letter;
                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={similarModal.submitted}
                              onClick={() =>
                                setSimilarModal((prev) =>
                                  prev ? { ...prev, draftAnswer: letter } : null
                                )
                              }
                              className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border text-sm cursor-pointer ${
                                picked
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

                    {!similarModal.submitted ? (
                      <button
                        type="button"
                        disabled={!similarModal.draftAnswer.trim()}
                        onClick={() =>
                          setSimilarModal((prev) =>
                            prev ? { ...prev, submitted: true } : null
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-sm">
                        <div className="font-semibold">
                          {simCorrect ? (
                            <span className="text-emerald-700">
                              Correct ({simQ.correctAnswer})
                            </span>
                          ) : (
                            <span className="text-red-700">
                              Incorrect — Correct Answer: {simQ.correctAnswer}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-700">
                          <MathText text={simQ.solution || ''} />
                        </div>
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

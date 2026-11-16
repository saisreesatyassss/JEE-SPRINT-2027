import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPortalView } from './components/AdminPortalView.tsx';
import { DailyChallengeView } from './components/DailyChallengeView.tsx';
import { HomeView } from './components/HomeView.tsx';
import { MockTestView } from './components/MockTestView.tsx';
import { ResultsView } from './components/ResultsView.tsx';
import { RevisionView } from './components/RevisionView.tsx';
import { SyllabusView } from './components/SyllabusView.tsx';
import { evaluateAnswerLocal } from './lib/evaluate.ts';
import {
  addMistakeToRevision,
  getAnonymousSessionToken,
  getKolkataTodayString,
  loadDailyState,
  loadRevisionList,
  recordRevisionAttempt,
  removeFromRevisionList,
  saveDailyHistorySummary,
  saveDailyState,
  type DailyProgressState,
  type PracticeMode,
  type RevisionItem,
} from './lib/storage.ts';
import type { DailyChallengeResponse, QuestionDTO } from './shared/syllabus.ts';

type AppView = 'home' | 'daily' | 'results' | 'mock' | 'revision' | 'syllabus' | 'admin';

function getInitialView(): AppView {
  if (typeof window !== 'undefined') {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
  }
  return 'home';
}

export default function App() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [challenge, setChallenge] = useState<DailyChallengeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('practice');
  const [dailyState, setDailyState] = useState<DailyProgressState | null>(null);
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>(() => loadRevisionList());

  const hydrateDaily = useCallback(async () => {
    const todayIst = getKolkataTodayString();
    const cached = loadDailyState(todayIst);
    if (cached && cached.cachedQuestions.length > 0) {
      setDailyState(cached);
      setSelectedMode(cached.mode);
    }

    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/daily-challenge');
      if (!res.ok) throw new Error('Failed to load today’s daily challenge.');
      const data = (await res.json()) as DailyChallengeResponse;
      setChallenge(data);

      const existing = loadDailyState(data.challengeDate);
      if (existing && existing.cachedQuestions.length > 0) {
        const merged: DailyProgressState = {
          ...existing,
          cachedQuestions: data.questions,
          isLimitedSet: data.isLimitedSet,
        };
        setDailyState(merged);
        setSelectedMode(merged.mode);
        saveDailyState(merged);
      } else {
        const fresh: DailyProgressState = {
          challengeDate: data.challengeDate,
          mode: selectedMode,
          currentIndex: 0,
          answers: {},
          submittedIds: [],
          markedIds: [],
          timeSpentByQuestion: {},
          totalElapsedSeconds: 0,
          isCompleted: false,
          cachedQuestions: data.questions,
          isLimitedSet: data.isLimitedSet,
        };
        setDailyState(fresh);
        saveDailyState(fresh);
      }
    } catch {
      if (cached && cached.cachedQuestions.length > 0) {
        setChallenge({
          challengeDate: cached.challengeDate,
          timezone: 'Asia/Kolkata',
          isLimitedSet: cached.isLimitedSet,
          bankStats: {
            totalPublished: cached.cachedQuestions.length,
            targetReleaseSize: 3000,
            bySubject: { Physics: 10, Chemistry: 10, Mathematics: 10 },
          },
          questions: cached.cachedQuestions,
        });
      } else {
        setLoadError('Unable to reach the question repository. Please refresh to retry.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrateDaily();
  }, [hydrateDaily]);

  // Detect IST midnight rollover while tab stays open
  useEffect(() => {
    const id = window.setInterval(() => {
      const currentIst = getKolkataTodayString();
      if (challenge && challenge.challengeDate !== currentIst) {
        void hydrateDaily();
      }
    }, 30000);
    return () => window.clearInterval(id);
  }, [challenge?.challengeDate, hydrateDaily]);

  const navigate = (nextView: AppView) => {
    setView(nextView);
    if (typeof window !== 'undefined') {
      if (nextView === 'admin') {
        window.history.replaceState(null, '', '/admin');
      } else if (window.location.pathname === '/admin') {
        window.history.replaceState(null, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpdateDailyState = useCallback(
    (updater: (prev: DailyProgressState) => DailyProgressState) => {
      setDailyState((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        saveDailyState(next);
        return next;
      });
    },
    []
  );

  const handleSelectMode = (mode: PracticeMode) => {
    setSelectedMode(mode);
    setDailyState((prev) => {
      if (!prev || prev.isCompleted) return prev;
      const updated = { ...prev, mode };
      saveDailyState(updated);
      return updated;
    });
  };

  const handleStartDaily = () => {
    if (!dailyState) return;
    if (dailyState.isCompleted) {
      navigate('results');
    } else {
      navigate('daily');
    }
  };

  const handleSubmitQuestionAttempt = useCallback(
    (question: QuestionDTO, answer: string, isCorrect: boolean) => {
      if (!isCorrect) {
        const updated = addMistakeToRevision(question, answer);
        setRevisionItems(updated);
      }

      const sessionToken = getAnonymousSessionToken();
      const challengeDate = dailyState?.challengeDate ?? getKolkataTodayString();
      const timeSpent = dailyState?.timeSpentByQuestion[question.id] ?? 0;

      fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          challengeDate,
          questionId: question.id,
          selectedAnswer: answer,
          timeSpentSeconds: timeSpent,
          mode: dailyState?.mode ?? 'practice',
        }),
      }).catch(() => {
        // Offline-safe: localStorage retains full state
      });
    },
    [dailyState?.challengeDate, dailyState?.mode, dailyState?.timeSpentByQuestion]
  );

  const handleFinishChallenge = useCallback(() => {
    if (!dailyState) return;

    const allQuestions = dailyState.cachedQuestions;
    const submittedSet = new Set(dailyState.submittedIds);
    let latestRevision = loadRevisionList();
    let attempted = 0;
    let correct = 0;

    for (const q of allQuestions) {
      const ans = dailyState.answers[q.id]?.trim() ?? '';
      if (!ans) continue;
      attempted++;
      const ok = evaluateAnswerLocal(q, ans);
      if (ok) {
        correct++;
      } else {
        latestRevision = addMistakeToRevision(q, ans);
      }
      if (!submittedSet.has(q.id)) {
        submittedSet.add(q.id);
        fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: getAnonymousSessionToken(),
            challengeDate: dailyState.challengeDate,
            questionId: q.id,
            selectedAnswer: ans,
            timeSpentSeconds: dailyState.timeSpentByQuestion[q.id] ?? 0,
            mode: dailyState.mode,
          }),
        }).catch(() => {});
      }
    }

    setRevisionItems(latestRevision);

    const finalized: DailyProgressState = {
      ...dailyState,
      submittedIds: Array.from(submittedSet),
      isCompleted: true,
    };
    setDailyState(finalized);
    saveDailyState(finalized);

    saveDailyHistorySummary({
      challengeDate: finalized.challengeDate,
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
      timeSpentSeconds: finalized.totalElapsedSeconds,
    });

    navigate('results');
  }, [dailyState]);

  const savedAttemptCount = useMemo(() => {
    if (!dailyState) return 0;
    return dailyState.cachedQuestions.filter((q) =>
      Boolean(dailyState.answers[q.id]?.trim())
    ).length;
  }, [dailyState]);

  const revisionDueCount = useMemo(() => {
    const now = Date.now();
    return revisionItems.filter(
      (item) => !item.mastered && new Date(item.dueAt).getTime() <= now
    ).length;
  }, [revisionItems]);

  const ctaLabel = dailyState?.isCompleted
    ? 'View Results'
    : savedAttemptCount > 0
    ? 'Resume Sprint'
    : "Start Today's Set";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="font-display text-lg font-extrabold tracking-tight text-slate-900 hover:text-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            JEE SPRINT <span className="text-blue-700">2027</span>
          </button>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {(
              [
                ['daily', 'Daily Challenge'],
                ['mock', 'Mock Test'],
                ['revision', 'Revision'],
                ['syllabus', 'Syllabus'],
              ] as Array<[AppView, string]>
            ).map(([key, label]) => {
              const active = view === key || (key === 'daily' && view === 'results');
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'daily' && dailyState?.isCompleted) {
                      navigate('results');
                    } else {
                      navigate(key);
                    }
                  }}
                  className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
                    active
                      ? 'border-blue-700 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            disabled={loading || !dailyState}
            onClick={handleStartDaily}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {ctaLabel}
          </button>
        </div>

        {/* Compact mobile navigation row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs font-medium">
          {(
            [
              ['daily', 'Daily Challenge'],
              ['mock', 'Mock Test'],
              ['revision', 'Revision'],
              ['syllabus', 'Syllabus'],
            ] as Array<[AppView, string]>
          ).map(([key, label]) => {
            const active = view === key || (key === 'daily' && view === 'results');
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(key)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {view === 'home' && (
          <HomeView
            challenge={challenge}
            loading={loading}
            error={loadError}
            savedAttemptCount={savedAttemptCount}
            isDailyCompleted={Boolean(dailyState?.isCompleted)}
            revisionDueCount={revisionDueCount}
            revisionTotalCount={revisionItems.length}
            selectedMode={selectedMode}
            onSelectMode={handleSelectMode}
            onStartDaily={handleStartDaily}
            onOpenMockTest={() => navigate('mock')}
            onOpenRevision={() => navigate('revision')}
            onOpenSyllabus={() => navigate('syllabus')}
          />
        )}

        {view === 'daily' && dailyState && (
          <DailyChallengeView
            state={dailyState}
            onUpdateState={handleUpdateDailyState}
            onSubmitQuestionAttempt={handleSubmitQuestionAttempt}
            onFinishChallenge={handleFinishChallenge}
            onBackHome={() => navigate('home')}
          />
        )}

        {view === 'results' && dailyState && (
          <ResultsView
            state={dailyState}
            onReviewQuestion={(index) => {
              handleUpdateDailyState((prev) => ({ ...prev, currentIndex: index }));
              navigate('daily');
            }}
            onOpenRevision={() => navigate('revision')}
            onBackHome={() => navigate('home')}
          />
        )}

        {view === 'mock' && <MockTestView onBackHome={() => navigate('home')} />}

        {view === 'revision' && (
          <RevisionView
            items={revisionItems}
            onRecordAttempt={(questionId, isCorrect) => {
              const updated = recordRevisionAttempt(questionId, isCorrect);
              setRevisionItems(updated);
            }}
            onRemoveItem={(questionId) => {
              const updated = removeFromRevisionList(questionId);
              setRevisionItems(updated);
            }}
          />
        )}

        {view === 'syllabus' && <SyllabusView />}

        {view === 'admin' && <AdminPortalView onBackHome={() => navigate('home')} />}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            JEE SPRINT 2027 · Zero-login daily practice · Asia/Kolkata schedule · Progress stored locally in your browser
          </div>
          <button
            type="button"
            onClick={() => navigate('admin')}
            className="text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
          >
            Reviewer Portal
          </button>
        </div>
      </footer>
    </div>
  );
}

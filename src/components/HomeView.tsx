import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clock, FileCheck2, RotateCcw } from 'lucide-react';
import type { PracticeMode } from '../lib/storage.ts';
import type { DailyChallengeResponse } from '../shared/syllabus.ts';

interface HomeViewProps {
  challenge: DailyChallengeResponse | null;
  loading: boolean;
  error: string | null;
  savedAttemptCount: number;
  isDailyCompleted: boolean;
  revisionDueCount: number;
  revisionTotalCount: number;
  selectedMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
  onStartDaily: () => void;
  onOpenMockTest: () => void;
  onOpenRevision: () => void;
  onOpenSyllabus: () => void;
}

function getTimeUntilKolkataMidnight(): string {
  const now = new Date();
  // Convert current UTC time to IST (UTC+5:30 = +330 minutes)
  const istOffsetMs = 330 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  const nextMidnightIst = new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  const diffSec = Math.max(0, Math.floor((nextMidnightIst.getTime() - istNow.getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function formatReadableKolkataDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

export const HomeView: React.FC<HomeViewProps> = ({
  challenge,
  loading,
  error,
  savedAttemptCount,
  isDailyCompleted,
  revisionDueCount,
  revisionTotalCount,
  selectedMode,
  onSelectMode,
  onStartDaily,
  onOpenMockTest,
  onOpenRevision,
  onOpenSyllabus,
}) => {
  const [countdown, setCountdown] = useState(getTimeUntilKolkataMidnight);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(getTimeUntilKolkataMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const difficultyBreakdown = useMemo(() => {
    if (!challenge) return { Easy: 9, Medium: 15, Hard: 6 };
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    for (const q of challenge.questions) {
      if (q.difficulty === 'Easy' || q.difficulty === 'Medium' || q.difficulty === 'Hard') {
        counts[q.difficulty]++;
      }
    }
    return counts;
  }, [challenge]);

  const subjectBreakdown = useMemo(() => {
    if (!challenge) return { Physics: 10, Chemistry: 10, Mathematics: 10 };
    const counts = { Physics: 0, Chemistry: 0, Mathematics: 0 };
    for (const q of challenge.questions) {
      counts[q.subject]++;
    }
    return counts;
  }, [challenge]);

  const estimatedMinutes = useMemo(() => {
    if (!challenge || challenge.questions.length === 0) return 55;
    const totalSec = challenge.questions.reduce(
      (sum, q) => sum + (q.estimatedTimeSeconds || 90),
      0
    );
    return Math.max(30, Math.round(totalSec / 60));
  }, [challenge]);

  const primaryLabel = isDailyCompleted
    ? "Review Today's Results"
    : savedAttemptCount > 0
    ? `Resume Today's Challenge (${savedAttemptCount}/30)`
    : "Start Today's Challenge";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <div className="text-sm font-medium text-slate-500">
            Zero-login daily practice · Asia/Kolkata schedule
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
            Your daily practice. Your next breakthrough.
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            30 carefully selected questions. Three subjects. One stronger JEE aspirant every day.
          </p>

          {/* Practice vs Test Mode Toggle */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-medium text-slate-500">Select solving mode</div>
            <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onSelectMode('practice')}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedMode === 'practice'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Practice Mode · Instant Feedback
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('test')}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedMode === 'test'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Test Mode · Feedback After Submit
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              disabled={loading || !challenge || challenge.questions.length === 0}
              onClick={onStartDaily}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-blue-700 text-white font-semibold text-base hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <span>{loading ? 'Loading Daily Set...' : primaryLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenMockTest}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-white text-slate-800 border border-slate-300 font-medium text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileCheck2 className="w-4 h-4 text-slate-600" />
              <span>Full 75Q Mock Test</span>
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </div>

        {/* Right Specification Card */}
        <div className="lg:col-span-5">
          <div className="h-full bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-medium text-slate-500">Today’s Challenge</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {challenge ? formatReadableKolkataDate(challenge.challengeDate) : 'Loading...'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-500">Next Set (IST)</div>
                  <div className="font-mono tabular-nums text-base font-semibold text-blue-700 mt-0.5">
                    {countdown}
                  </div>
                </div>
              </div>

              <dl className="divide-y divide-slate-100 text-sm">
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Total Questions</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-900">
                    {challenge?.questions.length ?? 30} Questions
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Subject Split</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 text-right">
                    {subjectBreakdown.Physics}P · {subjectBreakdown.Chemistry}C · {subjectBreakdown.Mathematics}M
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Difficulty Mix</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 text-right">
                    {difficultyBreakdown.Easy} Easy · {difficultyBreakdown.Medium} Med · {difficultyBreakdown.Hard} Hard
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Estimated Duration</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{estimatedMinutes} min</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              {challenge ? (
                <span>
                  Approved bank: <strong className="font-mono tabular-nums text-slate-700">{challenge.bankStats.totalPublished}</strong> verified questions
                  {challenge.isLimitedSet
                    ? ' (growing toward 3,000-question release target; set curated from approved repository).'
                    : '.'}
                </span>
              ) : (
                <span>Synchronizing daily set with verified repository...</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3-Column Utility Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-200 pt-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-500">Local Progress</div>
            <h2 className="text-lg font-semibold text-slate-900">No Account Needed</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your answers, time spent, and review bookmarks save automatically in this browser—refreshing never erases your work.
            </p>
          </div>
          <div className="text-sm font-mono tabular-nums text-slate-800 pt-2 border-t border-slate-100">
            Today: {savedAttemptCount} / {challenge?.questions.length ?? 30} attempted
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-500">Spaced Repetition</div>
            <h2 className="text-lg font-semibold text-slate-900">Mistake Revision Queue</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every incorrect answer is captured with its core formula, scheduled for re-testing, and exportable as a clean PDF.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-mono tabular-nums text-slate-800">
              {revisionDueCount} due · {revisionTotalCount} saved
            </span>
            <button
              type="button"
              onClick={onOpenRevision}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Open Revision</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-500">2027 Curriculum</div>
            <h2 className="text-lg font-semibold text-slate-900">Official 55-Unit Syllabus</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aligned strictly to NTA JEE Main Paper 1 units across Physics, Chemistry, and Mathematics with chapter drills.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm font-mono tabular-nums text-slate-800">
              20P · 20C · 15M Units
            </span>
            <button
              type="button"
              onClick={onOpenSyllabus}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore Syllabus</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

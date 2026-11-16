import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  CheckCircle2,
  Edit3,
  FilePlus2,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import {
  JEE_2027_SYLLABUS,
  type DifficultyLevel,
  type QuestionType,
  type SubjectName,
  type VerificationStatus,
} from '../shared/syllabus.ts';
import { MathText } from './MathText.tsx';

interface DbUser {
  id: number;
  uid: string;
  email: string;
  role: 'admin' | 'reviewer' | 'viewer';
  createdAt: string;
}

interface ValidationRecord {
  id: number;
  questionId: number;
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
  validatorModel: string | null;
  validatedAt: string;
}

interface AdminQuestionRow {
  id: number;
  externalId: string;
  subject: SubjectName;
  chapter: string;
  topic: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  questionText: string;
  diagramSvg?: string | null;
  options: string[];
  optionExplanations: string[];
  correctAnswer: string;
  numericalTolerance: number;
  solution: string;
  conceptTested: string;
  formulaUsed: string;
  estimatedTimeSeconds: number;
  sourceType: 'Original' | 'OfficialPYQ' | 'NCERTExemplar';
  sourceReference: string | null;
  verificationStatus: VerificationStatus;
  reviewVersion: number;
  aiProvider: string | null;
  latestValidation?: ValidationRecord | null;
}

interface AdminStatsPayload {
  byStatus: Array<{ status: string; count: number }>;
  bySubject: Array<{ subject: string; status: string; count: number }>;
  recentValidations: Array<{
    id: number;
    questionId: number;
    overallPassed: boolean;
    rejectionReason: string | null;
    validatorModel: string | null;
    validatedAt: string;
  }>;
}

type AdminTab = 'queue' | 'generate' | 'create' | 'daily';

export const AdminPortalView: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isReviewer, setIsReviewer] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('queue');
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Queue state
  const [statusFilter, setStatusFilter] = useState<string>('Validated');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [questionsList, setQuestionsList] = useState<AdminQuestionRow[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [editingQ, setEditingQ] = useState<AdminQuestionRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // AI Generation state
  const [genSubject, setGenSubject] = useState<SubjectName>('Physics');
  const [genChapter, setGenChapter] = useState<string>(JEE_2027_SYLLABUS.Physics[0].name);
  const [genTopic, setGenTopic] = useState<string>(JEE_2027_SYLLABUS.Physics[0].topics[0]);
  const [genDifficulty, setGenDifficulty] = useState<DifficultyLevel>('Medium');
  const [genType, setGenType] = useState<QuestionType>('MCQ');
  const [genCount, setGenCount] = useState<number>(2);
  const [generating, setGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<
    Array<{ question: AdminQuestionRow; validation: ValidationRecord }>
  >([]);

  // Manual create state
  const [manualSubject, setManualSubject] = useState<SubjectName>('Physics');
  const [manualChapter, setManualChapter] = useState<string>(JEE_2027_SYLLABUS.Physics[0].name);
  const [manualTopic, setManualTopic] = useState<string>(JEE_2027_SYLLABUS.Physics[0].topics[0]);
  const [manualDifficulty, setManualDifficulty] = useState<DifficultyLevel>('Medium');
  const [manualType, setManualType] = useState<QuestionType>('MCQ');
  const [manualText, setManualText] = useState('');
  const [manualOptA, setManualOptA] = useState('');
  const [manualOptB, setManualOptB] = useState('');
  const [manualOptC, setManualOptC] = useState('');
  const [manualOptD, setManualOptD] = useState('');
  const [manualExpA, setManualExpA] = useState('Check option A calculation');
  const [manualExpB, setManualExpB] = useState('Check option B calculation');
  const [manualExpC, setManualExpC] = useState('Check option C calculation');
  const [manualExpD, setManualExpD] = useState('Check option D calculation');
  const [manualAnswer, setManualAnswer] = useState('A');
  const [manualTolerance, setManualTolerance] = useState('0.01');
  const [manualSolution, setManualSolution] = useState('');
  const [manualConcept, setManualConcept] = useState('');
  const [manualFormula, setManualFormula] = useState('');
  const [manualTimeSec, setManualTimeSec] = useState('90');
  const [manualPublishNow, setManualPublishNow] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Bulk JSON import state
  const [bulkJson, setBulkJson] = useState('');
  const [importingBulk, setImportingBulk] = useState(false);

  // Stats, Daily Preview & Roles
  const [stats, setStats] = useState<AdminStatsPayload | null>(null);
  const [previewDate, setPreviewDate] = useState<string>(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  );
  const [previewQuestions, setPreviewQuestions] = useState<AdminQuestionRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [usersList, setUsersList] = useState<DbUser[]>([]);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required');
      const token = await user.getIdToken();
      return fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });
    },
    []
  );

  const loadMe = useCallback(async (user: User) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify reviewer account');
      }
      setDbUser(data.user ?? null);
      setIsReviewer(Boolean(data.isReviewer));
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to verify reviewer role.');
      setDbUser(null);
      setIsReviewer(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthReady(true);
      if (user) {
        void loadMe(user);
      } else {
        setDbUser(null);
        setIsReviewer(false);
      }
    });
    return () => unsub();
  }, [loadMe]);

  const loadQueue = useCallback(async () => {
    if (!isReviewer) return;
    setLoadingQueue(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (subjectFilter) params.set('subject', subjectFilter);
      params.set('limit', '60');
      const res = await authedFetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load review queue');
      setQuestionsList(data.questions ?? []);
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Unable to fetch questions.' });
    } finally {
      setLoadingQueue(false);
    }
  }, [authedFetch, isReviewer, statusFilter, subjectFilter]);

  const loadStatsAndUsers = useCallback(async () => {
    if (!isReviewer) return;
    try {
      const [statsRes, usersRes] = await Promise.all([
        authedFetch('/api/admin/stats'),
        authedFetch('/api/admin/users'),
      ]);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users ?? []);
      }
    } catch {
      // Ignore secondary refresh errors
    }
  }, [authedFetch, isReviewer]);

  useEffect(() => {
    if (isReviewer) {
      void loadQueue();
      void loadStatsAndUsers();
    }
  }, [isReviewer, loadQueue, loadStatsAndUsers]);

  const handleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In failed.');
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setQuestionsList([]);
    setStats(null);
  };

  const handleStatusChange = async (id: number, status: VerificationStatus) => {
    setNotice(null);
    try {
      const res = await authedFetch(`/api/admin/questions/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Status update blocked by validation');
      }
      setNotice({ type: 'ok', text: `Question #${id} marked as ${status}.` });
      void loadQueue();
      void loadStatsAndUsers();
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Failed to update status.' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingQ) return;
    setSavingEdit(true);
    setNotice(null);
    try {
      const res = await authedFetch(`/api/admin/questions/${editingQ.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingQ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save edit');
      setEditingQ(null);
      setNotice({
        type: data.validation?.overallPassed ? 'ok' : 'err',
        text: data.validation?.overallPassed
          ? `Question #${editingQ.id} re-validated and saved.`
          : `Saved, but failed validation: ${data.validation?.rejectionReason}`,
      });
      void loadQueue();
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Failed to save question.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setNotice(null);
    try {
      const res = await authedFetch('/api/admin/generate', {
        method: 'POST',
        body: JSON.stringify({
          subject: genSubject,
          chapter: genChapter,
          topic: genTopic,
          difficulty: genDifficulty,
          questionType: genType,
          count: genCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      setGeneratedResults(data.results ?? []);
      setNotice({
        type: 'ok',
        text: `Generated ${data.generatedCount} question(s) via ${data.provider} and ran independent Pass 2 verification.`,
      });
      void loadStatsAndUsers();
      void loadQueue();
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'AI generation unavailable.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingManual(true);
    setNotice(null);
    try {
      const isNum = manualType === 'Numerical';
      const payload = {
        subject: manualSubject,
        chapter: manualChapter,
        topic: manualTopic,
        difficulty: manualDifficulty,
        questionType: manualType,
        questionText: manualText,
        options: isNum ? [] : [manualOptA, manualOptB, manualOptC, manualOptD],
        optionExplanations: isNum
          ? []
          : [manualExpA, manualExpB, manualExpC, manualExpD],
        correctAnswer: manualAnswer,
        numericalTolerance: Number(manualTolerance) || 0.01,
        solution: manualSolution,
        conceptTested: manualConcept,
        formulaUsed: manualFormula,
        estimatedTimeSeconds: Number(manualTimeSec) || 90,
        sourceType: 'Original',
        requestedStatus: manualPublishNow ? 'Published' : 'Validated',
      };
      const res = await authedFetch('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Validation failed');
      }
      setNotice({
        type: data.validation?.overallPassed ? 'ok' : 'err',
        text: data.validation?.overallPassed
          ? `Created question ${data.question.externalId} (${data.question.verificationStatus}).`
          : `Rejected by 8-stage pipeline: ${data.validation?.rejectionReason}`,
      });
      if (data.validation?.overallPassed) {
        setManualText('');
        setManualOptA('');
        setManualOptB('');
        setManualOptC('');
        setManualOptD('');
        setManualSolution('');
      }
      void loadQueue();
      void loadStatsAndUsers();
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Failed to create question.' });
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleBulkImport = async () => {
    setImportingBulk(true);
    setNotice(null);
    try {
      const parsed = JSON.parse(bulkJson);
      const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
        throw new Error('Provide a JSON array of questions or { "questions": [...] }');
      }
      const res = await authedFetch('/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ questions: questionsArray }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk import failed');
      setNotice({
        type: 'ok',
        text: `Processed ${data.imported} questions: ${data.validatedCount} Validated, ${data.rejectedCount} Rejected.`,
      });
      setBulkJson('');
      void loadQueue();
      void loadStatsAndUsers();
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Invalid JSON or import failure.' });
    } finally {
      setImportingBulk(false);
    }
  };

  const handleLoadPreview = async () => {
    setLoadingPreview(true);
    setNotice(null);
    try {
      const res = await authedFetch(
        `/api/admin/daily-preview?date=${encodeURIComponent(previewDate)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to preview daily set');
      setPreviewQuestions(data.questions ?? []);
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Failed to load daily preview.' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRoleUpdate = async (userId: number, role: 'admin' | 'reviewer' | 'viewer') => {
    setNotice(null);
    try {
      const res = await authedFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Role update failed');
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
      );
      setNotice({ type: 'ok', text: `Updated role for ${data.user.email} to ${role}.` });
    } catch (err: any) {
      setNotice({ type: 'err', text: err?.message || 'Failed to update role.' });
    }
  };

  const genChapters = useMemo(() => JEE_2027_SYLLABUS[genSubject], [genSubject]);
  const manualChapters = useMemo(() => JEE_2027_SYLLABUS[manualSubject], [manualSubject]);

  if (!authReady) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-sm text-slate-600">
        Initializing reviewer portal...
      </div>
    );
  }

  // Unauthenticated view
  if (!fbUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Internal Question Curation & Validation
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Reviewer Portal</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Students never sign in to practice on JEE SPRINT 2027. Reviewer authentication protects the 8-stage validation queue, AI problem generator, and syllabus publishing controls.
            </p>
          </div>

          {authError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {authError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={authLoading}
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>

            <button
              type="button"
              onClick={onBackHome}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Return to Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but unauthorized
  if (!authLoading && !isReviewer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-amber-700">Access Restricted</div>
            <h1 className="text-xl font-bold text-slate-900">Reviewer Role Required</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Signed in as <strong className="text-slate-900">{fbUser.email}</strong> (current role:{' '}
              <span className="font-mono">{dbUser?.role ?? 'viewer'}</span>). Ask an existing administrator to grant <span className="font-mono">reviewer</span> or <span className="font-mono">admin</span> permissions.
            </p>
          </div>
          {authError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {authError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium cursor-pointer"
            >
              Return to Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>
              Internal Editorial Console · {dbUser?.email} ({dbUser?.role})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Question Quality & Validation Portal
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Student View
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Status Totals Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {['Published', 'Validated', 'ExpertReviewed', 'Draft', 'Generated', 'Rejected'].map(
            (st) => {
              const row = stats.byStatus.find((s) => s.status === st);
              return (
                <div key={st} className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs text-slate-500">{st}</div>
                  <div className="text-xl font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                    {row?.count ?? 0}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="inline-flex flex-wrap items-center p-1 bg-slate-200/70 rounded-lg border border-slate-200">
        {(
          [
            ['queue', 'Review Queue'],
            ['generate', 'AI Generate & Verify'],
            ['create', 'Manual Add & Bulk Import'],
            ['daily', 'Daily Preview & Roles'],
          ] as Array<[AdminTab, string]>
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border flex items-center justify-between gap-3 ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Validated">Validated (Awaiting Publish)</option>
                <option value="ExpertReviewed">ExpertReviewed</option>
                <option value="Published">Published</option>
                <option value="Rejected">Rejected</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadQueue}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {loadingQueue ? (
            <p className="text-sm text-slate-600">Loading questions...</p>
          ) : questionsList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
              No questions found matching this filter.
            </div>
          ) : (
            <div className="space-y-4">
              {questionsList.map((q) => {
                const v = q.latestValidation;
                const stages = v
                  ? [
                      ['Syllabus', v.stageSyllabus],
                      ['Math', v.stageMathConsistency],
                      ['Answer', v.stageAnswerVerification],
                      ['Options', v.stageOptionVerification],
                      ['Ambiguity', v.stageAmbiguityCheck],
                      ['Duplicate', v.stageDuplicateCheck],
                      ['Difficulty', v.stageDifficultyClassification],
                      ['Explanation', v.stageExplanationVerification],
                    ]
                  : [];

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="text-xs sm:text-sm text-slate-600">
                        <span className="font-mono font-semibold text-slate-900">
                          {q.externalId}
                        </span>
                        <span className="mx-1.5">·</span>
                        <span className="font-medium text-blue-700">{q.subject}</span>
                        <span className="mx-1.5">·</span>
                        <span>{q.chapter}</span>
                        <span className="mx-1.5">·</span>
                        <span>{q.difficulty}</span>
                        <span className="mx-1.5">·</span>
                        <span>{q.questionType}</span>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono font-semibold text-slate-900">
                          [{q.verificationStatus}]
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingQ(q)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {q.verificationStatus !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(q.id, 'Published')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </button>
                        )}
                        {q.verificationStatus !== 'Rejected' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(q.id, 'Rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-medium hover:bg-red-50 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-slate-900 leading-relaxed">
                      <MathText text={q.questionText} />
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                      <div>
                        <strong>Key:</strong> <span className="font-mono">{q.correctAnswer}</span>{' '}
                        · <strong>Concept:</strong> {q.conceptTested} · <strong>Formula:</strong>{' '}
                        <MathText text={q.formulaUsed} />
                      </div>
                      <div>
                        <strong>Solution:</strong> <MathText text={q.solution} />
                      </div>
                    </div>

                    {v && (
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="font-semibold text-slate-700">
                            8-Stage Validation ({v.validatorModel}):
                          </span>
                          {stages.map(([label, ok]) => (
                            <span
                              key={String(label)}
                              className={
                                ok ? 'text-emerald-700 font-medium' : 'text-red-700 font-semibold'
                              }
                            >
                              {ok ? 'PASS' : 'FAIL'} {label}
                            </span>
                          ))}
                          <span className="font-mono text-slate-500">
                            Sim: {(v.duplicateSimilarityScore * 100).toFixed(1)}%
                          </span>
                        </div>

                        {v.independentMethodOutput && (
                          <div className="text-xs text-slate-600">
                            <strong>Independent Pass 2:</strong> {v.independentMethodOutput}
                          </div>
                        )}
                        {v.rejectionReason && (
                          <div className="text-xs text-red-700 font-medium">
                            <strong>Rejection Reason:</strong> {v.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI GENERATE & VERIFY */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <form
            onSubmit={handleGenerate}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Server-Side AI Question Generator + Independent Pass 2 Solver
              </h2>
              <p className="text-sm text-slate-600">
                Generates candidate questions aligned to JEE Main 2027 syllabus, solves each problem independently without seeing Pass 1’s key, and enforces all 8 validation gates before staging as Validated or Rejected.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <select
                  value={genSubject}
                  onChange={(e) => {
                    const s = e.target.value as SubjectName;
                    setGenSubject(s);
                    setGenChapter(JEE_2027_SYLLABUS[s][0].name);
                    setGenTopic(JEE_2027_SYLLABUS[s][0].topics[0]);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Chapter</label>
                <select
                  value={genChapter}
                  onChange={(e) => {
                    const chName = e.target.value;
                    setGenChapter(chName);
                    const found = genChapters.find((c) => c.name === chName);
                    if (found?.topics[0]) setGenTopic(found.topics[0]);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {genChapters.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Topic</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Question Type
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as QuestionType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="MCQ">MCQ</option>
                  <option value="Numerical">Numerical</option>
                  <option value="AssertionReason">AssertionReason</option>
                  <option value="MultiConcept">MultiConcept</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Count (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Generating & Independently Verifying...' : 'Generate & Validate Batch'}</span>
            </button>
          </form>

          {generatedResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Latest Generated & Verified Batch
              </h3>
              {generatedResults.map(({ question: q, validation: v }) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-900">
                      {q.externalId} · {q.verificationStatus}
                    </span>
                    {v.overallPassed && q.verificationStatus !== 'Published' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(q.id, 'Published')}
                        className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        Approve & Publish
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-slate-900">
                    <MathText text={q.questionText} />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Key:</strong> {q.correctAnswer} ·{' '}
                    <strong>Independent Pass 2:</strong> {v.independentMethodOutput || 'N/A'}
                  </div>
                  {v.rejectionReason && (
                    <div className="text-xs text-red-700 font-medium">
                      Rejected: {v.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL ADD & BULK IMPORT */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateManual}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FilePlus2 className="w-4 h-4 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">Add Single Question</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <select
                  value={manualSubject}
                  onChange={(e) => {
                    const s = e.target.value as SubjectName;
                    setManualSubject(s);
                    setManualChapter(JEE_2027_SYLLABUS[s][0].name);
                    setManualTopic(JEE_2027_SYLLABUS[s][0].topics[0]);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Chapter</label>
                <select
                  value={manualChapter}
                  onChange={(e) => setManualChapter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {manualChapters.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Topic</label>
                <input
                  type="text"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as QuestionType)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="Numerical">Numerical</option>
                    <option value="AssertionReason">AssertionReason</option>
                    <option value="MultiConcept">MultiConcept</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Question Statement (KaTeX supported with $...$)
              </label>
              <textarea
                rows={3}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {manualType !== 'Numerical' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Option A"
                  value={manualOptA}
                  onChange={(e) => setManualOptA(e.target.value)}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Option B"
                  value={manualOptB}
                  onChange={(e) => setManualOptB(e.target.value)}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Option C"
                  value={manualOptC}
                  onChange={(e) => setManualOptC(e.target.value)}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Option D"
                  value={manualOptD}
                  onChange={(e) => setManualOptD(e.target.value)}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder={manualType === 'Numerical' ? 'e.g. 24' : 'A, B, C, or D'}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Concept Tested
                </label>
                <input
                  type="text"
                  value={manualConcept}
                  onChange={(e) => setManualConcept(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Formula Used
                </label>
                <input
                  type="text"
                  value={manualFormula}
                  onChange={(e) => setManualFormula(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {manualType === 'Numerical' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tolerance
                  </label>
                  <input
                    type="text"
                    value={manualTolerance}
                    onChange={(e) => setManualTolerance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Est. Time (sec)
                  </label>
                  <input
                    type="number"
                    value={manualTimeSec}
                    onChange={(e) => setManualTimeSec(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            )}

            {manualType !== 'Numerical' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={manualExpA}
                  onChange={(e) => setManualExpA(e.target.value)}
                  placeholder="Explanation A"
                  className="px-2.5 py-1.5 border border-slate-300 rounded"
                />
                <input
                  type="text"
                  value={manualExpB}
                  onChange={(e) => setManualExpB(e.target.value)}
                  placeholder="Explanation B"
                  className="px-2.5 py-1.5 border border-slate-300 rounded"
                />
                <input
                  type="text"
                  value={manualExpC}
                  onChange={(e) => setManualExpC(e.target.value)}
                  placeholder="Explanation C"
                  className="px-2.5 py-1.5 border border-slate-300 rounded"
                />
                <input
                  type="text"
                  value={manualExpD}
                  onChange={(e) => setManualExpD(e.target.value)}
                  placeholder="Explanation D"
                  className="px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Step-by-step Solution (min 35 chars)
              </label>
              <textarea
                rows={3}
                value={manualSolution}
                onChange={(e) => setManualSolution(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualPublishNow}
                  onChange={(e) => setManualPublishNow(e.target.checked)}
                />
                <span>Publish immediately if all 8 validation stages pass</span>
              </label>

              <button
                type="submit"
                disabled={submittingManual}
                className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {submittingManual ? 'Validating...' : 'Validate & Save'}
              </button>
            </div>
          </form>

          {/* Bulk JSON Importer */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload className="w-4 h-4 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">Bulk JSON Repository Import</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paste a JSON array (up to 50 questions per batch). Every question runs through the 8-stage validation pipeline before entering the Validated queue or Rejected log.
            </p>
            <textarea
              rows={12}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder='[{"subject":"Physics","chapter":"Kinematics","topic":"Projectile Motion","difficulty":"Medium","questionType":"MCQ",...}]'
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
            />
            <button
              type="button"
              disabled={importingBulk || !bulkJson.trim()}
              onClick={handleBulkImport}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              {importingBulk ? 'Running 8-Stage Batch Validation...' : 'Validate & Import Batch'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY PREVIEW & ROLES */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Daily Challenge Generator Preview (Asia/Kolkata)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Inspect or pre-generate the deterministic 30-question daily set for any IST date.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={previewDate}
                  onChange={(e) => setPreviewDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
                <button
                  type="button"
                  disabled={loadingPreview}
                  onClick={handleLoadPreview}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer"
                >
                  {loadingPreview ? 'Loading...' : 'Preview / Pre-generate'}
                </button>
              </div>
            </div>

            {previewQuestions.length > 0 && (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto border-t border-slate-100 pt-2">
                {previewQuestions.map((q, idx) => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-mono font-semibold text-slate-900">
                        {String(idx + 1).padStart(2, '0')}. {q.externalId}
                      </span>{' '}
                      · <span className="text-blue-700 font-medium">{q.subject}</span> · {q.chapter}{' '}
                      · {q.difficulty} · {q.questionType}
                    </div>
                    <span className="font-mono text-slate-500">{q.verificationStatus}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {usersList.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Editorial & Reviewer Accounts</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 font-medium">Email</th>
                      <th className="py-2 font-medium">Current Role</th>
                      <th className="py-2 font-medium text-right">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="py-3 font-medium text-slate-900">{u.email}</td>
                        <td className="py-3 font-mono text-xs text-slate-600">{u.role}</td>
                        <td className="py-3 text-right">
                          <select
                            value={u.role}
                            disabled={dbUser?.role !== 'admin'}
                            onChange={(e) =>
                              handleRoleUpdate(
                                u.id,
                                e.target.value as 'admin' | 'reviewer' | 'viewer'
                              )
                            }
                            className="px-2.5 py-1 border border-slate-300 rounded text-xs bg-white disabled:opacity-50"
                          >
                            <option value="admin">admin</option>
                            <option value="reviewer">reviewer</option>
                            <option value="viewer">viewer</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Edit Modal */}
      {editingQ && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Question {editingQ.externalId}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQ(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Question Text
                </label>
                <textarea
                  rows={3}
                  value={editingQ.questionText}
                  onChange={(e) =>
                    setEditingQ({ ...editingQ, questionText: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {editingQ.questionType !== 'Numerical' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {editingQ.options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...editingQ.options];
                        next[idx] = e.target.value;
                        setEditingQ({ ...editingQ, options: next });
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={editingQ.correctAnswer}
                    onChange={(e) =>
                      setEditingQ({ ...editingQ, correctAnswer: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Formula Used
                  </label>
                  <input
                    type="text"
                    value={editingQ.formulaUsed}
                    onChange={(e) =>
                      setEditingQ({ ...editingQ, formulaUsed: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Solution
                </label>
                <textarea
                  rows={4}
                  value={editingQ.solution}
                  onChange={(e) => setEditingQ({ ...editingQ, solution: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingQ(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer"
              >
                {savingEdit ? 'Re-validating...' : 'Save & Re-validate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

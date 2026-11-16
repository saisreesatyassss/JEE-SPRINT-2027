import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  mockTestAttempts,
  mockTests,
  questionAttempts,
  questionValidations,
  questions,
} from './src/db/schema.ts';
import { listReviewerUsers, updateUserRole } from './src/db/users.ts';
import { requireAuth, requireReviewer, type AuthRequest } from './src/middleware/auth.ts';
import { getConfiguredAIProvider } from './src/server/aiProvider.ts';
import {
  getKolkataDateString,
  getMockTestWithQuestions,
  getOrCreateDailyChallenge,
  getOrCreateDefaultMockTests,
  getPublishedBankStats,
} from './src/server/dailyEngine.ts';
import { ensureSeeded } from './src/server/seedBank.ts';
import {
  evaluateStudentAnswer,
  runEightStageValidation,
  type CandidateQuestionInput,
} from './src/server/validationEngine.ts';
import {
  JEE_2027_EXAM_PATTERN,
  JEE_2027_SYLLABUS,
  type DifficultyLevel,
  type QuestionType,
  type SubjectName,
} from './src/shared/syllabus.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

// Health endpoint (lightweight, no eager DB probe)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timezone: 'Asia/Kolkata', istDate: getKolkataDateString() });
});

// Lazy seed middleware for API endpoints
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    next();
    return;
  }
  try {
    await ensureSeeded();
    next();
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(503).json({
      error: 'Service temporarily unavailable while initializing question repository.',
    });
  }
});

// ---------------------------------------------------------------------------
// PUBLIC ZERO-LOGIN STUDENT ENDPOINTS
// ---------------------------------------------------------------------------

app.get('/api/daily-challenge', async (req, res) => {
  try {
    const requestedDate =
      typeof req.query.date === 'string' ? req.query.date.trim() : undefined;
    const challenge = await getOrCreateDailyChallenge(requestedDate);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(challenge);
  } catch (err) {
    console.error('Error fetching daily challenge:', err);
    res.status(500).json({ error: 'Failed to load daily challenge.' });
  }
});

app.get('/api/syllabus', async (_req, res) => {
  try {
    const counts = await db
      .select({
        subject: questions.subject,
        chapter: questions.chapter,
        total: sql<number>`count(*)::int`,
      })
      .from(questions)
      .where(eq(questions.verificationStatus, 'Published'))
      .groupBy(questions.subject, questions.chapter);

    const countMap = new Map(
      counts.map((r) => [`${r.subject}::${r.chapter}`, Number(r.total)])
    );

    const syllabusWithCounts = {
      Physics: JEE_2027_SYLLABUS.Physics.map((ch) => ({
        ...ch,
        publishedCount: countMap.get(`Physics::${ch.name}`) ?? 0,
      })),
      Chemistry: JEE_2027_SYLLABUS.Chemistry.map((ch) => ({
        ...ch,
        publishedCount: countMap.get(`Chemistry::${ch.name}`) ?? 0,
      })),
      Mathematics: JEE_2027_SYLLABUS.Mathematics.map((ch) => ({
        ...ch,
        publishedCount: countMap.get(`Mathematics::${ch.name}`) ?? 0,
      })),
    };

    const bankStats = await getPublishedBankStats();

    res.json({
      syllabus: syllabusWithCounts,
      examPattern: JEE_2027_EXAM_PATTERN,
      bankStats,
    });
  } catch (err) {
    console.error('Error loading syllabus:', err);
    res.status(500).json({ error: 'Failed to load syllabus coverage.' });
  }
});

app.get('/api/questions/similar', async (req, res) => {
  try {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    const chapter = typeof req.query.chapter === 'string' ? req.query.chapter : '';
    const excludeRaw = typeof req.query.excludeIds === 'string' ? req.query.excludeIds : '';
    const limit = Math.min(Number(req.query.limit) || 4, 10);

    const excludeIds = excludeRaw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    const conditions = [eq(questions.verificationStatus, 'Published')];
    if (subject) conditions.push(eq(questions.subject, subject));
    if (chapter) conditions.push(eq(questions.chapter, chapter));
    if (excludeIds.length > 0) conditions.push(notInArray(questions.id, excludeIds));

    let rows = await db
      .select()
      .from(questions)
      .where(and(...conditions))
      .limit(limit);

    if (rows.length === 0 && subject) {
      const fallbackConds = [
        eq(questions.verificationStatus, 'Published'),
        eq(questions.subject, subject),
      ];
      if (excludeIds.length > 0) fallbackConds.push(notInArray(questions.id, excludeIds));
      rows = await db
        .select()
        .from(questions)
        .where(and(...fallbackConds))
        .limit(limit);
    }

    res.json({ questions: rows });
  } catch (err) {
    console.error('Error finding similar questions:', err);
    res.status(500).json({ error: 'Failed to load similar questions.' });
  }
});

app.get('/api/questions/chapter', async (req, res) => {
  try {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    const chapter = typeof req.query.chapter === 'string' ? req.query.chapter : '';
    if (!subject || !chapter) {
      res.status(400).json({ error: 'subject and chapter query parameters are required.' });
      return;
    }

    const rows = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.verificationStatus, 'Published'),
          eq(questions.subject, subject),
          eq(questions.chapter, chapter)
        )
      )
      .orderBy(questions.id);

    res.json({ questions: rows });
  } catch (err) {
    console.error('Error fetching chapter questions:', err);
    res.status(500).json({ error: 'Failed to load chapter questions.' });
  }
});

app.post('/api/attempts', async (req, res) => {
  try {
    const {
      sessionToken,
      challengeDate,
      questionId,
      selectedAnswer,
      timeSpentSeconds,
      mode,
    } = req.body ?? {};

    if (!sessionToken || !questionId || selectedAnswer === undefined) {
      res.status(400).json({ error: 'Missing required attempt fields.' });
      return;
    }

    const [q] = await db
      .select()
      .from(questions)
      .where(and(eq(questions.id, Number(questionId)), eq(questions.verificationStatus, 'Published')))
      .limit(1);

    if (!q) {
      res.status(404).json({ error: 'Approved question not found.' });
      return;
    }

    const isCorrect = evaluateStudentAnswer(q, String(selectedAnswer));

    await db.insert(questionAttempts).values({
      sessionToken: String(sessionToken).slice(0, 64),
      challengeDate: String(challengeDate || getKolkataDateString()).slice(0, 16),
      questionId: q.id,
      selectedAnswer: String(selectedAnswer).slice(0, 64),
      isCorrect,
      timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
      mode: String(mode || 'practice').slice(0, 24),
    });

    res.json({
      isCorrect,
      correctAnswer: q.correctAnswer,
      solution: q.solution,
      formulaUsed: q.formulaUsed,
      conceptTested: q.conceptTested,
      optionExplanations: q.optionExplanations,
    });
  } catch (err) {
    console.error('Error recording attempt:', err);
    res.status(500).json({ error: 'Failed to evaluate attempt.' });
  }
});

app.get('/api/mock-tests', async (_req, res) => {
  try {
    const list = await getOrCreateDefaultMockTests();
    res.json({
      examPattern: JEE_2027_EXAM_PATTERN,
      mockTests: list.map((m) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        patternStatus: m.patternStatus,
        durationMinutes: m.durationMinutes,
        totalQuestions: m.totalQuestions,
        totalMarks: m.totalMarks,
        markingScheme: m.markingScheme,
      })),
    });
  } catch (err) {
    console.error('Error listing mock tests:', err);
    res.status(500).json({ error: 'Failed to load mock tests.' });
  }
});

app.get('/api/mock-tests/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid mock test id.' });
      return;
    }

    const payload = await getMockTestWithQuestions(id);
    if (!payload) {
      res.status(404).json({ error: 'Mock test not found.' });
      return;
    }

    res.json(payload);
  } catch (err) {
    console.error('Error loading mock test:', err);
    res.status(500).json({ error: 'Failed to load mock test.' });
  }
});

app.post('/api/mock-tests/:id/submit', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { sessionToken, answers, timeSpentSeconds } = req.body ?? {};
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid mock test id.' });
      return;
    }

    const payload = await getMockTestWithQuestions(id);
    if (!payload) {
      res.status(404).json({ error: 'Mock test not found.' });
      return;
    }

    const submittedMap = (answers ?? {}) as Record<string, string>;
    const scheme = payload.mockTest.markingScheme;

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const subjectBreakdown: Record<
      string,
      { score: number; correct: number; incorrect: number; unattempted: number }
    > = {
      Physics: { score: 0, correct: 0, incorrect: 0, unattempted: 0 },
      Chemistry: { score: 0, correct: 0, incorrect: 0, unattempted: 0 },
      Mathematics: { score: 0, correct: 0, incorrect: 0, unattempted: 0 },
    };

    const questionResults = payload.questions.map((q) => {
      const rawAns = submittedMap[String(q.id)]?.trim() ?? '';
      const subj = subjectBreakdown[q.subject] ?? {
        score: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
      };

      if (!rawAns) {
        unattemptedCount++;
        subj.unattempted++;
        return {
          questionId: q.id,
          subject: q.subject,
          chapter: q.chapter,
          submittedAnswer: '',
          correctAnswer: q.correctAnswer,
          status: 'unattempted' as const,
          marksAwarded: scheme.unattempted,
        };
      }

      const isCorrect = evaluateStudentAnswer(
        {
          questionType: q.questionType,
          correctAnswer: q.correctAnswer ?? '',
          numericalTolerance: q.numericalTolerance,
        },
        rawAns
      );

      if (isCorrect) {
        correctCount++;
        subj.correct++;
        score += scheme.correct;
        subj.score += scheme.correct;
      } else {
        incorrectCount++;
        subj.incorrect++;
        const penalty =
          q.questionType === 'Numerical' && !scheme.numericalNegativeMarking
            ? 0
            : scheme.incorrect;
        score += penalty;
        subj.score += penalty;
      }

      return {
        questionId: q.id,
        subject: q.subject,
        chapter: q.chapter,
        submittedAnswer: rawAns,
        correctAnswer: q.correctAnswer,
        status: isCorrect ? ('correct' as const) : ('incorrect' as const),
        marksAwarded: isCorrect ? scheme.correct : scheme.incorrect,
      };
    });

    await db.insert(mockTestAttempts).values({
      mockTestId: payload.mockTest.id,
      sessionToken: String(sessionToken || 'anonymous').slice(0, 64),
      score,
      maxScore: payload.mockTest.totalMarks,
      correctCount,
      incorrectCount,
      unattemptedCount,
      subjectBreakdown,
      timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
    });

    res.json({
      score,
      maxScore: payload.mockTest.totalMarks,
      correctCount,
      incorrectCount,
      unattemptedCount,
      subjectBreakdown,
      questionResults,
    });
  } catch (err) {
    console.error('Error submitting mock test:', err);
    res.status(500).json({ error: 'Failed to grade mock test.' });
  }
});

// ---------------------------------------------------------------------------
// PROTECTED INTERNAL ADMIN & REVIEWER ENDPOINTS
// ---------------------------------------------------------------------------

app.get('/api/admin/me', requireAuth, (req: AuthRequest, res) => {
  res.json({
    user: req.dbUser,
    isReviewer: req.dbUser?.role === 'admin' || req.dbUser?.role === 'reviewer',
  });
});

app.get('/api/admin/stats', requireAuth, requireReviewer, async (_req, res) => {
  try {
    const byStatus = await db
      .select({
        status: questions.verificationStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .groupBy(questions.verificationStatus);

    const bySubject = await db
      .select({
        subject: questions.subject,
        status: questions.verificationStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .groupBy(questions.subject, questions.verificationStatus);

    const recentValidations = await db
      .select({
        id: questionValidations.id,
        questionId: questionValidations.questionId,
        overallPassed: questionValidations.overallPassed,
        rejectionReason: questionValidations.rejectionReason,
        validatorModel: questionValidations.validatorModel,
        validatedAt: questionValidations.validatedAt,
      })
      .from(questionValidations)
      .orderBy(desc(questionValidations.validatedAt))
      .limit(25);

    res.json({ byStatus, bySubject, recentValidations });
  } catch (err) {
    console.error('Error loading admin stats:', err);
    res.status(500).json({ error: 'Failed to load admin statistics.' });
  }
});

app.get('/api/admin/questions', requireAuth, requireReviewer, async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const conditions = [];
    if (status) conditions.push(eq(questions.verificationStatus, status));
    if (subject) conditions.push(eq(questions.subject, subject));

    const qRows =
      conditions.length > 0
        ? await db
            .select()
            .from(questions)
            .where(and(...conditions))
            .orderBy(desc(questions.id))
            .limit(limit)
        : await db.select().from(questions).orderBy(desc(questions.id)).limit(limit);

    const qIds = qRows.map((q) => q.id);
    const valRows =
      qIds.length > 0
        ? await db
            .select()
            .from(questionValidations)
            .where(inArray(questionValidations.questionId, qIds))
            .orderBy(desc(questionValidations.id))
        : [];

    const latestValidationByQid = new Map<number, typeof questionValidations.$inferSelect>();
    for (const v of valRows) {
      if (!latestValidationByQid.has(v.questionId)) {
        latestValidationByQid.set(v.questionId, v);
      }
    }

    res.json({
      questions: qRows.map((q) => ({
        ...q,
        latestValidation: latestValidationByQid.get(q.id) ?? null,
      })),
    });
  } catch (err) {
    console.error('Error listing admin questions:', err);
    res.status(500).json({ error: 'Failed to load questions.' });
  }
});

app.post('/api/admin/questions', requireAuth, requireReviewer, async (req, res) => {
  try {
    const body = req.body as CandidateQuestionInput & { requestedStatus?: string };
    const existingSnippets = await db
      .select({ id: questions.id, questionText: questions.questionText })
      .from(questions);

    const report = runEightStageValidation(body, existingSnippets, {
      validatorModel: 'admin-pipeline-v1',
    });

    const requestedStatus = body.requestedStatus || 'Draft';
    if (requestedStatus === 'Published' && !report.overallPassed) {
      res.status(400).json({
        error: 'Cannot publish invalid question. Resolve validation failures first.',
        validation: report,
      });
      return;
    }

    const finalStatus = report.overallPassed
      ? requestedStatus === 'Published'
        ? 'Published'
        : 'Validated'
      : 'Rejected';

    const extId =
      body.externalId?.trim() ||
      `${String(body.subject).slice(0, 3).toUpperCase()}-ADM-${Date.now()}`;

    const [inserted] = await db
      .insert(questions)
      .values({
        externalId: extId,
        subject: body.subject,
        chapter: body.chapter,
        topic: body.topic,
        difficulty: body.difficulty,
        questionType: body.questionType,
        questionText: body.questionText,
        diagramSvg: body.diagramSvg ?? null,
        options: body.options ?? [],
        optionExplanations: body.optionExplanations ?? [],
        correctAnswer: body.correctAnswer,
        numericalTolerance: body.numericalTolerance ?? 0.01,
        solution: body.solution,
        conceptTested: body.conceptTested,
        formulaUsed: body.formulaUsed,
        estimatedTimeSeconds: body.estimatedTimeSeconds ?? 90,
        sourceType: body.sourceType ?? 'Original',
        sourceReference: body.sourceReference ?? null,
        verificationStatus: finalStatus,
        reviewVersion: 1,
      })
      .returning();

    const [valRecord] = await db
      .insert(questionValidations)
      .values({
        questionId: inserted.id,
        ...report,
      })
      .returning();

    res.status(201).json({ question: inserted, validation: valRecord });
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Failed to save question.' });
  }
});

app.patch('/api/admin/questions/:id', requireAuth, requireReviewer, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    const updatedPayload: CandidateQuestionInput = {
      id,
      subject: req.body.subject ?? existing.subject,
      chapter: req.body.chapter ?? existing.chapter,
      topic: req.body.topic ?? existing.topic,
      difficulty: req.body.difficulty ?? existing.difficulty,
      questionType: req.body.questionType ?? existing.questionType,
      questionText: req.body.questionText ?? existing.questionText,
      diagramSvg: req.body.diagramSvg !== undefined ? req.body.diagramSvg : existing.diagramSvg,
      options: req.body.options ?? existing.options,
      optionExplanations: req.body.optionExplanations ?? existing.optionExplanations,
      correctAnswer: req.body.correctAnswer ?? existing.correctAnswer,
      numericalTolerance: req.body.numericalTolerance ?? existing.numericalTolerance,
      solution: req.body.solution ?? existing.solution,
      conceptTested: req.body.conceptTested ?? existing.conceptTested,
      formulaUsed: req.body.formulaUsed ?? existing.formulaUsed,
      estimatedTimeSeconds: req.body.estimatedTimeSeconds ?? existing.estimatedTimeSeconds,
      sourceType: req.body.sourceType ?? existing.sourceType,
      sourceReference:
        req.body.sourceReference !== undefined
          ? req.body.sourceReference
          : existing.sourceReference,
    };

    const existingSnippets = await db
      .select({ id: questions.id, questionText: questions.questionText })
      .from(questions);

    const report = runEightStageValidation(updatedPayload, existingSnippets, {
      validatorModel: 'admin-revalidation-v1',
    });

    const newStatus = !report.overallPassed
      ? 'Rejected'
      : existing.verificationStatus === 'Published'
      ? 'Published'
      : 'ExpertReviewed';

    const [saved] = await db
      .update(questions)
      .set({
        subject: updatedPayload.subject,
        chapter: updatedPayload.chapter,
        topic: updatedPayload.topic,
        difficulty: updatedPayload.difficulty,
        questionType: updatedPayload.questionType,
        questionText: updatedPayload.questionText,
        diagramSvg: updatedPayload.diagramSvg ?? null,
        options: updatedPayload.options,
        optionExplanations: updatedPayload.optionExplanations ?? [],
        correctAnswer: updatedPayload.correctAnswer,
        numericalTolerance: updatedPayload.numericalTolerance ?? 0.01,
        solution: updatedPayload.solution,
        conceptTested: updatedPayload.conceptTested,
        formulaUsed: updatedPayload.formulaUsed,
        estimatedTimeSeconds: updatedPayload.estimatedTimeSeconds ?? 90,
        sourceType: updatedPayload.sourceType ?? 'Original',
        sourceReference: updatedPayload.sourceReference ?? null,
        verificationStatus: newStatus,
        reviewVersion: existing.reviewVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, id))
      .returning();

    const [valRecord] = await db
      .insert(questionValidations)
      .values({
        questionId: id,
        ...report,
      })
      .returning();

    res.json({ question: saved, validation: valRecord });
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

app.post(
  '/api/admin/questions/:id/status',
  requireAuth,
  requireReviewer,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body ?? {};
      const allowed = ['Draft', 'Generated', 'Validated', 'ExpertReviewed', 'Published', 'Rejected'];
      if (!allowed.includes(status)) {
        res.status(400).json({ error: 'Invalid verification status.' });
        return;
      }

      const [q] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
      if (!q) {
        res.status(404).json({ error: 'Question not found.' });
        return;
      }

      if (status === 'Published') {
        const existingSnippets = await db
          .select({ id: questions.id, questionText: questions.questionText })
          .from(questions);

        const report = runEightStageValidation(
          {
            id: q.id,
            subject: q.subject,
            chapter: q.chapter,
            topic: q.topic,
            difficulty: q.difficulty,
            questionType: q.questionType,
            questionText: q.questionText,
            diagramSvg: q.diagramSvg,
            options: q.options,
            optionExplanations: q.optionExplanations,
            correctAnswer: q.correctAnswer,
            numericalTolerance: q.numericalTolerance,
            solution: q.solution,
            conceptTested: q.conceptTested,
            formulaUsed: q.formulaUsed,
            estimatedTimeSeconds: q.estimatedTimeSeconds,
            sourceType: q.sourceType,
            sourceReference: q.sourceReference,
          },
          existingSnippets,
          { validatorModel: 'publish-gate-v1' }
        );

        await db.insert(questionValidations).values({
          questionId: q.id,
          ...report,
        });

        if (!report.overallPassed) {
          await db
            .update(questions)
            .set({ verificationStatus: 'Rejected', updatedAt: new Date() })
            .where(eq(questions.id, id));
          res.status(400).json({
            error: 'Publish blocked: question failed 8-stage validation.',
            validation: report,
          });
          return;
        }
      }

      const [updated] = await db
        .update(questions)
        .set({ verificationStatus: status, updatedAt: new Date() })
        .where(eq(questions.id, id))
        .returning();

      res.json({ question: updated });
    } catch (err) {
      console.error('Error changing question status:', err);
      res.status(500).json({ error: 'Failed to update question status.' });
    }
  }
);

app.post('/api/admin/generate', requireAuth, requireReviewer, async (req, res) => {
  try {
    const {
      subject,
      chapter,
      topic,
      difficulty = 'Medium',
      questionType = 'MCQ',
      count = 2,
    } = req.body ?? {};

    if (!subject || !chapter || !topic) {
      res.status(400).json({ error: 'subject, chapter, and topic are required.' });
      return;
    }

    const aiProvider = getConfiguredAIProvider();
    const drafts = await aiProvider.generateQuestions({
      subject: subject as SubjectName,
      chapter,
      topic,
      difficulty: difficulty as DifficultyLevel,
      questionType: questionType as QuestionType,
      count: Number(count) || 2,
    });

    const existingSnippets = await db
      .select({ id: questions.id, questionText: questions.questionText })
      .from(questions);

    const results = [];

    for (const draft of drafts) {
      // Independent Pass 2 solve without exposing Pass 1 answer key
      const independentSolve = await aiProvider.independentlyVerifyQuestion({
        subject: draft.subject,
        chapter: draft.chapter,
        questionType: draft.questionType,
        questionText: draft.questionText,
        options: draft.options,
      });

      const report = runEightStageValidation(draft, existingSnippets, independentSolve);
      const status = report.overallPassed ? 'Validated' : 'Rejected';
      const externalId = `${draft.subject.slice(0, 3).toUpperCase()}-AI-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      const [inserted] = await db
        .insert(questions)
        .values({
          externalId,
          subject: draft.subject,
          chapter: draft.chapter,
          topic: draft.topic,
          difficulty: draft.difficulty,
          questionType: draft.questionType,
          questionText: draft.questionText,
          options: draft.options,
          optionExplanations: draft.optionExplanations,
          correctAnswer: draft.correctAnswer,
          numericalTolerance: draft.numericalTolerance,
          solution: draft.solution,
          conceptTested: draft.conceptTested,
          formulaUsed: draft.formulaUsed,
          estimatedTimeSeconds: draft.estimatedTimeSeconds,
          sourceType: 'Original',
          sourceReference: null,
          verificationStatus: status,
          reviewVersion: 1,
          aiProvider: draft.aiProvider,
        })
        .returning();

      const [validationRow] = await db
        .insert(questionValidations)
        .values({
          questionId: inserted.id,
          ...report,
        })
        .returning();

      existingSnippets.push({
        id: inserted.id,
        questionText: inserted.questionText,
      });

      results.push({ question: inserted, validation: validationRow });
    }

    res.json({
      provider: aiProvider.providerName,
      generatedCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error('AI generation error:', err);
    res.status(502).json({
      error:
        err?.message ||
        'AI question generation failed. Existing approved bank continues operating normally.',
    });
  }
});

app.post('/api/admin/import', requireAuth, requireReviewer, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.questions) ? req.body.questions : [];
    if (items.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty questions array.' });
      return;
    }

    const existingSnippets = await db
      .select({ id: questions.id, questionText: questions.questionText })
      .from(questions);

    let validatedCount = 0;
    let rejectedCount = 0;

    for (const raw of items.slice(0, 50)) {
      const candidate: CandidateQuestionInput = {
        externalId: raw.externalId,
        subject: raw.subject,
        chapter: raw.chapter,
        topic: raw.topic,
        difficulty: raw.difficulty,
        questionType: raw.questionType || raw.question_type || 'MCQ',
        questionText: raw.questionText || raw.question_text,
        options: raw.options ?? [],
        optionExplanations: raw.optionExplanations ?? [],
        correctAnswer: String(raw.correctAnswer ?? raw.correct_answer ?? ''),
        numericalTolerance: Number(raw.numericalTolerance ?? 0.01),
        solution: raw.solution ?? '',
        conceptTested: raw.conceptTested || raw.concept_tested || '',
        formulaUsed: raw.formulaUsed || raw.formula_used || '',
        estimatedTimeSeconds: Number(raw.estimatedTimeSeconds || raw.estimated_time_seconds || 90),
        sourceType: raw.sourceType || raw.source_type || 'Original',
        sourceReference: raw.sourceReference ?? raw.source_reference ?? null,
      };

      const report = runEightStageValidation(candidate, existingSnippets, {
        validatorModel: 'bulk-import-validator-v1',
      });
      const status = report.overallPassed ? 'Validated' : 'Rejected';
      if (report.overallPassed) validatedCount++;
      else rejectedCount++;

      const extId =
        candidate.externalId?.trim() ||
        `${String(candidate.subject).slice(0, 3).toUpperCase()}-IMP-${Date.now()}-${Math.floor(
          Math.random() * 10000
        )}`;

      const [inserted] = await db
        .insert(questions)
        .values({
          externalId: extId,
          subject: candidate.subject,
          chapter: candidate.chapter,
          topic: candidate.topic,
          difficulty: candidate.difficulty,
          questionType: candidate.questionType,
          questionText: candidate.questionText,
          options: candidate.options,
          optionExplanations: candidate.optionExplanations ?? [],
          correctAnswer: candidate.correctAnswer,
          numericalTolerance: candidate.numericalTolerance ?? 0.01,
          solution: candidate.solution,
          conceptTested: candidate.conceptTested,
          formulaUsed: candidate.formulaUsed,
          estimatedTimeSeconds: candidate.estimatedTimeSeconds ?? 90,
          sourceType: candidate.sourceType ?? 'Original',
          sourceReference: candidate.sourceReference ?? null,
          verificationStatus: status,
          reviewVersion: 1,
        })
        .onConflictDoNothing({ target: questions.externalId })
        .returning();

      if (inserted) {
        await db.insert(questionValidations).values({
          questionId: inserted.id,
          ...report,
        });
        existingSnippets.push({
          id: inserted.id,
          questionText: inserted.questionText,
        });
      }
    }

    res.json({ imported: validatedCount + rejectedCount, validatedCount, rejectedCount });
  } catch (err) {
    console.error('Error importing questions:', err);
    res.status(500).json({ error: 'Failed to import question batch.' });
  }
});

app.get('/api/admin/daily-preview', requireAuth, requireReviewer, async (req, res) => {
  try {
    const date =
      typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : getKolkataDateString();
    const challenge = await getOrCreateDailyChallenge(date);
    res.json(challenge);
  } catch (err) {
    console.error('Error previewing daily set:', err);
    res.status(500).json({ error: 'Failed to generate daily preview.' });
  }
});

app.get('/api/admin/users', requireAuth, requireReviewer, async (_req, res) => {
  try {
    const usersList = await listReviewerUsers();
    res.json({ users: usersList });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

app.patch('/api/admin/users/:id/role', requireAuth, requireReviewer, async (req: AuthRequest, res) => {
  try {
    if (req.dbUser?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can modify reviewer roles.' });
      return;
    }
    const targetId = Number(req.params.id);
    const { role } = req.body ?? {};
    if (!['admin', 'reviewer', 'viewer'].includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }
    const updated = await updateUserRole(targetId, role);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

// ---------------------------------------------------------------------------
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
// ---------------------------------------------------------------------------

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JEE SPRINT 2027 server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

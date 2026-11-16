import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  dailyChallengeQuestions,
  dailyChallenges,
  mockTests,
  questions,
} from '../db/schema.ts';
import {
  JEE_2027_EXAM_PATTERN,
  type DailyChallengeResponse,
  type QuestionDTO,
  type SubjectName,
} from '../shared/syllabus.ts';

export function getKolkataDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function mapQuestionRowToDTO(
  row: typeof questions.$inferSelect,
  position?: number
): QuestionDTO {
  return {
    id: row.id,
    externalId: row.externalId,
    subject: row.subject as SubjectName,
    chapter: row.chapter,
    topic: row.topic,
    difficulty: row.difficulty as QuestionDTO['difficulty'],
    questionType: row.questionType as QuestionDTO['questionType'],
    questionText: row.questionText,
    diagramSvg: row.diagramSvg,
    options: row.options ?? [],
    optionExplanations: row.optionExplanations ?? [],
    correctAnswer: row.correctAnswer,
    numericalTolerance: row.numericalTolerance,
    solution: row.solution,
    conceptTested: row.conceptTested,
    formulaUsed: row.formulaUsed,
    estimatedTimeSeconds: row.estimatedTimeSeconds,
    sourceType: row.sourceType as QuestionDTO['sourceType'],
    sourceReference: row.sourceReference,
    verificationStatus: row.verificationStatus as QuestionDTO['verificationStatus'],
    reviewVersion: row.reviewVersion,
    position,
  };
}

export async function getPublishedBankStats(): Promise<{
  totalPublished: number;
  targetReleaseSize: number;
  bySubject: Record<SubjectName, number>;
}> {
  const rows = await db
    .select({
      subject: questions.subject,
      count: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(eq(questions.verificationStatus, 'Published'))
    .groupBy(questions.subject);

  const bySubject: Record<SubjectName, number> = {
    Physics: 0,
    Chemistry: 0,
    Mathematics: 0,
  };
  let totalPublished = 0;

  for (const r of rows) {
    if (r.subject === 'Physics' || r.subject === 'Chemistry' || r.subject === 'Mathematics') {
      bySubject[r.subject] = Number(r.count);
      totalPublished += Number(r.count);
    }
  }

  return {
    totalPublished,
    targetReleaseSize: 3000,
    bySubject,
  };
}

function selectSubjectQuestions(
  pool: Array<typeof questions.$inferSelect>,
  recentIds: Set<number>,
  rand: () => number
): { selected: Array<typeof questions.$inferSelect>; usedRepeats: boolean } {
  const targets: Array<{ difficulty: 'Easy' | 'Medium' | 'Hard'; count: number }> = [
    { difficulty: 'Easy', count: 3 },
    { difficulty: 'Medium', count: 5 },
    { difficulty: 'Hard', count: 2 },
  ];

  const chosen: Array<typeof questions.$inferSelect> = [];
  const chosenIds = new Set<number>();
  const chapterUsage = new Map<string, number>();
  let usedRepeats = false;

  const pickFromCandidates = (
    candidates: Array<typeof questions.$inferSelect>,
    needed: number,
    allowRepeats: boolean
  ) => {
    const shuffled = seededShuffle(candidates, rand);
    // Prioritize fresh (not in recentIds) and under-represented chapters
    const sorted = shuffled.sort((a, b) => {
      const aRecent = recentIds.has(a.id) ? 1 : 0;
      const bRecent = recentIds.has(b.id) ? 1 : 0;
      if (aRecent !== bRecent) return aRecent - bRecent;
      const aChap = chapterUsage.get(a.chapter) ?? 0;
      const bChap = chapterUsage.get(b.chapter) ?? 0;
      return aChap - bChap;
    });

    for (const q of sorted) {
      if (needed <= 0) break;
      if (chosenIds.has(q.id)) continue;
      if (!allowRepeats && recentIds.has(q.id)) continue;
      if (recentIds.has(q.id)) usedRepeats = true;
      chosen.push(q);
      chosenIds.add(q.id);
      chapterUsage.set(q.chapter, (chapterUsage.get(q.chapter) ?? 0) + 1);
      needed--;
    }
    return needed;
  };

  for (const target of targets) {
    const byDiff = pool.filter((q) => q.difficulty === target.difficulty);
    let rem = pickFromCandidates(byDiff, target.count, false);
    if (rem > 0) {
      rem = pickFromCandidates(byDiff, rem, true);
    }
    if (rem > 0) {
      rem = pickFromCandidates(pool, rem, false);
    }
    if (rem > 0) {
      pickFromCandidates(pool, rem, true);
    }
  }

  return { selected: chosen, usedRepeats };
}

export async function getOrCreateDailyChallenge(
  requestedDate?: string
): Promise<DailyChallengeResponse> {
  const challengeDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : getKolkataDateString();

  const bankStats = await getPublishedBankStats();

  // Check if daily challenge already exists for this date
  const existing = await db
    .select()
    .from(dailyChallenges)
    .where(eq(dailyChallenges.challengeDate, challengeDate))
    .limit(1);

  if (existing.length > 0) {
    const stored = existing[0];
    const joined = await db
      .select({
        position: dailyChallengeQuestions.position,
        question: questions,
      })
      .from(dailyChallengeQuestions)
      .innerJoin(questions, eq(dailyChallengeQuestions.questionId, questions.id))
      .where(eq(dailyChallengeQuestions.dailyChallengeId, stored.id))
      .orderBy(dailyChallengeQuestions.position);

    if (joined.length > 0) {
      return {
        challengeDate: stored.challengeDate,
        timezone: 'Asia/Kolkata',
        isLimitedSet: stored.isLimitedSet || bankStats.totalPublished < 3000,
        bankStats,
        questions: joined.map((row) => mapQuestionRowToDTO(row.question, row.position)),
      };
    }
  }

  // Gather recent 5 daily challenges (excluding requested date) to avoid repeats
  const recentChallenges = await db
    .select()
    .from(dailyChallenges)
    .orderBy(desc(dailyChallenges.challengeDate))
    .limit(6);

  const recentChallengeIds = recentChallenges
    .filter((c) => c.challengeDate !== challengeDate)
    .slice(0, 5)
    .map((c) => c.id);

  const recentQuestionIds = new Set<number>();
  if (recentChallengeIds.length > 0) {
    const recentRows = await db
      .select({ questionId: dailyChallengeQuestions.questionId })
      .from(dailyChallengeQuestions)
      .where(inArray(dailyChallengeQuestions.dailyChallengeId, recentChallengeIds));
    for (const r of recentRows) {
      recentQuestionIds.add(r.questionId);
    }
  }

  // Fetch all published questions
  const publishedPool = await db
    .select()
    .from(questions)
    .where(eq(questions.verificationStatus, 'Published'));

  const seedStr = `jee-sprint-2027::${challengeDate}`;
  const rand = mulberry32(fnv1aHash(seedStr));

  const subjectsOrder: SubjectName[] = ['Physics', 'Chemistry', 'Mathematics'];
  const allSelected: Array<{ question: typeof questions.$inferSelect; subject: SubjectName }> = [];
  let anyRepeats = false;

  for (const subj of subjectsOrder) {
    const pool = publishedPool.filter((q) => q.subject === subj);
    const { selected, usedRepeats } = selectSubjectQuestions(pool, recentQuestionIds, rand);
    if (usedRepeats || selected.length < 10) {
      anyRepeats = true;
    }
    for (const q of selected) {
      allSelected.push({ question: q, subject: subj });
    }
  }

  const isLimitedSet = anyRepeats || bankStats.totalPublished < 3000 || allSelected.length < 30;

  // Persist atomically (handle concurrent creation safely)
  if (allSelected.length > 0) {
    await db
      .insert(dailyChallenges)
      .values({
        challengeDate,
        seed: seedStr,
        isLimitedSet,
        totalQuestions: allSelected.length,
      })
      .onConflictDoNothing({ target: dailyChallenges.challengeDate });

    const [challengeRow] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.challengeDate, challengeDate))
      .limit(1);

    if (challengeRow) {
      const existingItems = await db
        .select({ id: dailyChallengeQuestions.id })
        .from(dailyChallengeQuestions)
        .where(eq(dailyChallengeQuestions.dailyChallengeId, challengeRow.id))
        .limit(1);

      if (existingItems.length === 0) {
        await db
          .insert(dailyChallengeQuestions)
          .values(
            allSelected.map((item, idx) => ({
              dailyChallengeId: challengeRow.id,
              questionId: item.question.id,
              subject: item.subject,
              position: idx + 1,
            }))
          )
          .onConflictDoNothing();
      }

      const finalRows = await db
        .select({
          position: dailyChallengeQuestions.position,
          question: questions,
        })
        .from(dailyChallengeQuestions)
        .innerJoin(questions, eq(dailyChallengeQuestions.questionId, questions.id))
        .where(eq(dailyChallengeQuestions.dailyChallengeId, challengeRow.id))
        .orderBy(dailyChallengeQuestions.position);

      return {
        challengeDate,
        timezone: 'Asia/Kolkata',
        isLimitedSet,
        bankStats,
        questions: finalRows.map((row) => mapQuestionRowToDTO(row.question, row.position)),
      };
    }
  }

  return {
    challengeDate,
    timezone: 'Asia/Kolkata',
    isLimitedSet: true,
    bankStats,
    questions: [],
  };
}

export async function getOrCreateDefaultMockTests() {
  const existing = await db.select().from(mockTests).orderBy(mockTests.id);
  if (existing.length > 0) {
    return existing;
  }

  const published = await db
    .select()
    .from(questions)
    .where(eq(questions.verificationStatus, 'Published'));

  const buildPaperQuestionIds = (seedKey: string): number[] => {
    const rand = mulberry32(fnv1aHash(seedKey));
    const resultIds: number[] = [];
    for (const subj of JEE_2027_EXAM_PATTERN.subjects) {
      const subjPool = published.filter((q) => q.subject === subj);
      const nonNumerical = seededShuffle(
        subjPool.filter((q) => q.questionType !== 'Numerical'),
        rand
      );
      const numerical = seededShuffle(
        subjPool.filter((q) => q.questionType === 'Numerical'),
        rand
      );

      const secA = nonNumerical.slice(0, 20);
      const secB = numerical.slice(0, 5);
      for (const q of secA) resultIds.push(q.id);
      for (const q of secB) resultIds.push(q.id);
    }
    return resultIds;
  };

  const paper1Ids = buildPaperQuestionIds('jee-sprint-mock-1-2027');
  const paper2Ids = buildPaperQuestionIds('jee-sprint-mock-2-2027');

  const specs = [
    {
      slug: 'jee-main-2027-sim-1',
      title: 'JEE Main 2027 Full Simulation — Paper 1',
      patternStatus: 'Provisional (NTA Paper 1 Format)',
      durationMinutes: 180,
      totalQuestions: paper1Ids.length,
      totalMarks: paper1Ids.length * 4,
      markingScheme: { ...JEE_2027_EXAM_PATTERN.markingScheme },
      questionIds: paper1Ids,
    },
    {
      slug: 'jee-main-2027-sim-2',
      title: 'JEE Main 2027 Full Simulation — Paper 2',
      patternStatus: 'Provisional (NTA Paper 1 Format)',
      durationMinutes: 180,
      totalQuestions: paper2Ids.length,
      totalMarks: paper2Ids.length * 4,
      markingScheme: { ...JEE_2027_EXAM_PATTERN.markingScheme },
      questionIds: paper2Ids,
    },
  ];

  for (const spec of specs) {
    if (spec.questionIds.length > 0) {
      await db.insert(mockTests).values(spec).onConflictDoNothing({ target: mockTests.slug });
    }
  }

  return await db.select().from(mockTests).orderBy(mockTests.id);
}

export async function getMockTestWithQuestions(mockTestId: number) {
  const [test] = await db
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, mockTestId))
    .limit(1);
  if (!test) return null;

  const qIds = test.questionIds ?? [];
  if (qIds.length === 0) return { mockTest: test, questions: [] };

  const qRows = await db
    .select()
    .from(questions)
    .where(and(inArray(questions.id, qIds), eq(questions.verificationStatus, 'Published')));

  const rowMap = new Map(qRows.map((r) => [r.id, r]));
  const ordered = qIds
    .map((id, idx) => {
      const row = rowMap.get(id);
      return row ? mapQuestionRowToDTO(row, idx + 1) : null;
    })
    .filter((item): item is QuestionDTO => item !== null);

  return { mockTest: test, questions: ordered };
}

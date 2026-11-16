import { count, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  chapters,
  questionSources,
  questionValidations,
  questions,
  subjects,
  topics,
} from '../db/schema.ts';
import { JEE_2027_SYLLABUS, type SubjectName } from '../shared/syllabus.ts';
import { CHEMISTRY_SEED_QUESTIONS } from './seedChemistry.ts';
import { MATHEMATICS_SEED_QUESTIONS } from './seedMathematics.ts';
import { PHYSICS_SEED_QUESTIONS } from './seedPhysics.ts';
import { buildExpandedPhysicsPartA } from './expandedPhysicsA.ts';
import { buildExpandedPhysicsPartB } from './expandedPhysicsB.ts';
import { buildExpandedChemistryPartA } from './expandedChemistryA.ts';
import { buildExpandedChemistryPartB } from './expandedChemistryB.ts';
import { buildExpandedMathPartA } from './expandedMathA.ts';
import { buildExpandedMathPartB } from './expandedMathB.ts';
import { runEightStageValidation } from './validationEngine.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runIdempotentSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runIdempotentSeed(): Promise<void> {
  // 1. Seed subjects, chapters, topics idempotently
  const subjectEntries: Array<{ name: SubjectName; slug: string; displayOrder: number }> = [
    { name: 'Physics', slug: 'physics', displayOrder: 1 },
    { name: 'Chemistry', slug: 'chemistry', displayOrder: 2 },
    { name: 'Mathematics', slug: 'mathematics', displayOrder: 3 },
  ];

  for (const s of subjectEntries) {
    await db
      .insert(subjects)
      .values(s)
      .onConflictDoNothing({ target: subjects.name });
  }

  const subjectRows = await db.select().from(subjects);
  const subjectMap = new Map(subjectRows.map((s) => [s.name, s.id]));

  for (const subjName of ['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]) {
    const subjId = subjectMap.get(subjName);
    if (!subjId) continue;
    const chapList = JEE_2027_SYLLABUS[subjName];
    for (const ch of chapList) {
      await db
        .insert(chapters)
        .values({
          subjectId: subjId,
          subjectName: subjName,
          name: ch.name,
          unitNumber: ch.unitNumber,
          ncertClass: ch.ncertClass,
          syllabusVerified: true,
        })
        .onConflictDoNothing();
    }
  }

  const chapterRows = await db.select().from(chapters);
  const chapterMap = new Map(
    chapterRows.map((c) => [`${c.subjectName}::${c.name}`, c.id])
  );

  for (const subjName of ['Physics', 'Chemistry', 'Mathematics'] as SubjectName[]) {
    for (const ch of JEE_2027_SYLLABUS[subjName]) {
      const chId = chapterMap.get(`${subjName}::${ch.name}`);
      if (!chId) continue;
      for (const topicName of ch.topics) {
        await db
          .insert(topics)
          .values({
            chapterId: chId,
            name: topicName,
            keyFormulas: [],
          })
          .onConflictDoNothing();
      }
    }
  }

  // 2. Seed question sources
  const defaultSources = [
    {
      name: 'JEE Sprint 2027 Editorial Bank',
      sourceType: 'Original',
      referenceNote: 'Original JEE Main 2027-aligned problems verified by 8-stage pipeline.',
    },
    {
      name: 'Official NTA Archive',
      sourceType: 'OfficialPYQ',
      referenceNote: 'Verified previous-year NTA JEE Main questions with exact shift citation.',
    },
  ];
  for (const src of defaultSources) {
    await db
      .insert(questionSources)
      .values(src)
      .onConflictDoNothing({ target: questionSources.name });
  }

  const [originalSource] = await db
    .select()
    .from(questionSources)
    .where(eq(questionSources.name, 'JEE Sprint 2027 Editorial Bank'))
    .limit(1);

  // 3. Check if questions already seeded
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(questions);

  if (Number(existingCount) >= 1200) {
    return;
  }

  const existingTopicRows = await db.select().from(topics);
  const topicMap = new Map(
    existingTopicRows.map((t) => [`${t.chapterId}::${t.name}`, t.id])
  );

  const existingQuestions = await db
    .select({
      id: questions.id,
      externalId: questions.externalId,
      questionText: questions.questionText,
    })
    .from(questions);
  const existingExtIds = new Set(existingQuestions.map((q) => q.externalId));

  const allSeed = [
    ...PHYSICS_SEED_QUESTIONS,
    ...CHEMISTRY_SEED_QUESTIONS,
    ...MATHEMATICS_SEED_QUESTIONS,
    ...buildExpandedPhysicsPartA(),
    ...buildExpandedPhysicsPartB(),
    ...buildExpandedChemistryPartA(),
    ...buildExpandedChemistryPartB(),
    ...buildExpandedMathPartA(),
    ...buildExpandedMathPartB(),
  ];

  for (const item of allSeed) {
    if (!item.externalId || existingExtIds.has(item.externalId)) continue;

    const report = runEightStageValidation(item, existingQuestions, {
      validatorModel: 'editorial-verification-v1',
    });

    const subjectId = subjectMap.get(item.subject) ?? null;
    const chapterId = chapterMap.get(`${item.subject}::${item.chapter}`) ?? null;
    const topicId = chapterId
      ? topicMap.get(`${chapterId}::${item.topic}`) ?? null
      : null;

    const status = report.overallPassed ? 'Published' : 'Rejected';

    const [inserted] = await db
      .insert(questions)
      .values({
        externalId: item.externalId,
        subjectId,
        chapterId,
        topicId,
        sourceId: originalSource?.id ?? null,
        subject: item.subject,
        chapter: item.chapter,
        topic: item.topic,
        difficulty: item.difficulty,
        questionType: item.questionType,
        questionText: item.questionText,
        diagramSvg: item.diagramSvg ?? null,
        options: item.options ?? [],
        optionExplanations: item.optionExplanations ?? [],
        correctAnswer: item.correctAnswer,
        numericalTolerance: item.numericalTolerance ?? 0.01,
        solution: item.solution,
        conceptTested: item.conceptTested,
        formulaUsed: item.formulaUsed,
        estimatedTimeSeconds: item.estimatedTimeSeconds ?? 90,
        sourceType: item.sourceType ?? 'Original',
        sourceReference: item.sourceReference ?? null,
        verificationStatus: status,
        reviewVersion: 1,
        aiProvider: null,
      })
      .onConflictDoNothing({ target: questions.externalId })
      .returning();

    if (inserted) {
      await db.insert(questionValidations).values({
        questionId: inserted.id,
        stageSyllabus: report.stageSyllabus,
        stageMathConsistency: report.stageMathConsistency,
        stageAnswerVerification: report.stageAnswerVerification,
        stageOptionVerification: report.stageOptionVerification,
        stageAmbiguityCheck: report.stageAmbiguityCheck,
        stageDuplicateCheck: report.stageDuplicateCheck,
        stageDifficultyClassification: report.stageDifficultyClassification,
        stageExplanationVerification: report.stageExplanationVerification,
        independentMethodOutput: report.independentMethodOutput,
        deterministicCheckPassed: report.deterministicCheckPassed,
        duplicateSimilarityScore: report.duplicateSimilarityScore,
        overallPassed: report.overallPassed,
        rejectionReason: report.rejectionReason,
        validatorModel: report.validatorModel,
      });

      existingQuestions.push({
        id: inserted.id,
        externalId: inserted.externalId,
        questionText: inserted.questionText,
      });
      existingExtIds.add(inserted.externalId);
    }
  }
}

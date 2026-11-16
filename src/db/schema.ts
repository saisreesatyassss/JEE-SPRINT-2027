import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('viewer'), // 'admin' | 'reviewer' | 'viewer'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  displayOrder: integer('display_order').notNull().default(0),
});

export const chapters = pgTable(
  'chapters',
  {
    id: serial('id').primaryKey(),
    subjectId: integer('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
    subjectName: text('subject_name').notNull(),
    name: text('name').notNull(),
    unitNumber: integer('unit_number').notNull(),
    ncertClass: text('ncert_class').notNull().default('11 & 12'),
    syllabusVerified: boolean('syllabus_verified').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('chapters_subject_name_idx').on(table.subjectName, table.name),
  ]
);

export const topics = pgTable(
  'topics',
  {
    id: serial('id').primaryKey(),
    chapterId: integer('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    keyFormulas: jsonb('key_formulas').$type<string[]>().notNull().default([]),
  },
  (table) => [uniqueIndex('topics_chapter_name_idx').on(table.chapterId, table.name)]
);

export const questionSources = pgTable('question_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  sourceType: text('source_type').notNull().default('Original'), // 'Original' | 'OfficialPYQ' | 'NCERTExemplar'
  referenceNote: text('reference_note'),
});

export const questions = pgTable(
  'questions',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    subjectId: integer('subject_id').references(() => subjects.id),
    chapterId: integer('chapter_id').references(() => chapters.id),
    topicId: integer('topic_id').references(() => topics.id),
    sourceId: integer('source_id').references(() => questionSources.id),
    subject: text('subject').notNull(), // 'Physics' | 'Chemistry' | 'Mathematics'
    chapter: text('chapter').notNull(),
    topic: text('topic').notNull(),
    difficulty: text('difficulty').notNull(), // 'Easy' | 'Medium' | 'Hard'
    questionType: text('question_type').notNull(), // 'MCQ' | 'Numerical' | 'AssertionReason' | 'MultiConcept' | 'Diagram'
    questionText: text('question_text').notNull(),
    diagramSvg: text('diagram_svg'),
    options: jsonb('options').$type<string[]>().notNull().default([]),
    optionExplanations: jsonb('option_explanations').$type<string[]>().notNull().default([]),
    correctAnswer: text('correct_answer').notNull(),
    numericalTolerance: real('numerical_tolerance').notNull().default(0.01),
    solution: text('solution').notNull(),
    conceptTested: text('concept_tested').notNull(),
    formulaUsed: text('formula_used').notNull(),
    estimatedTimeSeconds: integer('estimated_time_seconds').notNull().default(90),
    sourceType: text('source_type').notNull().default('Original'), // 'Original' | 'OfficialPYQ' | 'NCERTExemplar'
    sourceReference: text('source_reference'),
    verificationStatus: text('verification_status').notNull().default('Draft'), // 'Draft' | 'Generated' | 'Validated' | 'ExpertReviewed' | 'Published' | 'Rejected'
    reviewVersion: integer('review_version').notNull().default(1),
    aiProvider: text('ai_provider'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('questions_sub_diff_status_idx').on(
      table.subject,
      table.difficulty,
      table.verificationStatus
    ),
    index('questions_chapter_idx').on(table.chapter),
    index('questions_status_idx').on(table.verificationStatus),
  ]
);

export const questionValidations = pgTable(
  'question_validations',
  {
    id: serial('id').primaryKey(),
    questionId: integer('question_id')
      .references(() => questions.id, { onDelete: 'cascade' })
      .notNull(),
    stageSyllabus: boolean('stage_syllabus').notNull().default(false),
    stageMathConsistency: boolean('stage_math_consistency').notNull().default(false),
    stageAnswerVerification: boolean('stage_answer_verification').notNull().default(false),
    stageOptionVerification: boolean('stage_option_verification').notNull().default(false),
    stageAmbiguityCheck: boolean('stage_ambiguity_check').notNull().default(false),
    stageDuplicateCheck: boolean('stage_duplicate_check').notNull().default(false),
    stageDifficultyClassification: boolean('stage_difficulty_classification')
      .notNull()
      .default(false),
    stageExplanationVerification: boolean('stage_explanation_verification')
      .notNull()
      .default(false),
    independentMethodOutput: text('independent_method_output'),
    deterministicCheckPassed: boolean('deterministic_check_passed').notNull().default(false),
    duplicateSimilarityScore: real('duplicate_similarity_score').notNull().default(0),
    overallPassed: boolean('overall_passed').notNull().default(false),
    rejectionReason: text('rejection_reason'),
    validatorModel: text('validator_model'),
    validatedAt: timestamp('validated_at').defaultNow().notNull(),
  },
  (table) => [index('question_validations_qid_idx').on(table.questionId)]
);

export const dailyChallenges = pgTable('daily_challenges', {
  id: serial('id').primaryKey(),
  challengeDate: text('challenge_date').notNull().unique(), // YYYY-MM-DD (Asia/Kolkata)
  seed: text('seed').notNull(),
  isLimitedSet: boolean('is_limited_set').notNull().default(false),
  totalQuestions: integer('total_questions').notNull().default(30),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dailyChallengeQuestions = pgTable(
  'daily_challenge_questions',
  {
    id: serial('id').primaryKey(),
    dailyChallengeId: integer('daily_challenge_id')
      .references(() => dailyChallenges.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: integer('question_id')
      .references(() => questions.id, { onDelete: 'cascade' })
      .notNull(),
    subject: text('subject').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    index('dcq_challenge_id_idx').on(table.dailyChallengeId),
    uniqueIndex('dcq_challenge_question_unique').on(table.dailyChallengeId, table.questionId),
  ]
);

export const questionAttempts = pgTable(
  'question_attempts',
  {
    id: serial('id').primaryKey(),
    sessionToken: text('session_token').notNull(),
    challengeDate: text('challenge_date').notNull(),
    questionId: integer('question_id')
      .references(() => questions.id, { onDelete: 'cascade' })
      .notNull(),
    selectedAnswer: text('selected_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    mode: text('mode').notNull().default('practice'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('attempts_date_qid_idx').on(table.challengeDate, table.questionId)]
);

export interface MockTestMarkingScheme {
  correct: number;
  incorrect: number;
  unattempted: number;
  numericalNegativeMarking: boolean;
  sectionARules: string;
  sectionBRules: string;
}

export const mockTests = pgTable('mock_tests', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  patternStatus: text('pattern_status').notNull().default('Provisional'),
  durationMinutes: integer('duration_minutes').notNull().default(180),
  totalQuestions: integer('total_questions').notNull().default(75),
  totalMarks: integer('total_marks').notNull().default(300),
  markingScheme: jsonb('marking_scheme').$type<MockTestMarkingScheme>().notNull(),
  questionIds: jsonb('question_ids').$type<number[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface SubjectBreakdownEntry {
  score: number;
  correct: number;
  incorrect: number;
  unattempted: number;
}

export const mockTestAttempts = pgTable('mock_test_attempts', {
  id: serial('id').primaryKey(),
  mockTestId: integer('mock_test_id')
    .references(() => mockTests.id, { onDelete: 'cascade' })
    .notNull(),
  sessionToken: text('session_token').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  correctCount: integer('correct_count').notNull(),
  incorrectCount: integer('incorrect_count').notNull(),
  unattemptedCount: integer('unattempted_count').notNull(),
  subjectBreakdown: jsonb('subject_breakdown')
    .$type<Record<string, SubjectBreakdownEntry>>()
    .notNull(),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

// Relations
export const subjectsRelations = relations(subjects, ({ many }) => ({
  chapters: many(chapters),
  questions: many(questions),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [chapters.subjectId],
    references: [subjects.id],
  }),
  topics: many(topics),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  subjectEntity: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
  chapterEntity: one(chapters, {
    fields: [questions.chapterId],
    references: [chapters.id],
  }),
  validations: many(questionValidations),
}));

export const questionValidationsRelations = relations(questionValidations, ({ one }) => ({
  question: one(questions, {
    fields: [questionValidations.questionId],
    references: [questions.id],
  }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
  items: many(dailyChallengeQuestions),
}));

export const dailyChallengeQuestionsRelations = relations(
  dailyChallengeQuestions,
  ({ one }) => ({
    dailyChallenge: one(dailyChallenges, {
      fields: [dailyChallengeQuestions.dailyChallengeId],
      references: [dailyChallenges.id],
    }),
    question: one(questions, {
      fields: [dailyChallengeQuestions.questionId],
      references: [questions.id],
    }),
  })
);

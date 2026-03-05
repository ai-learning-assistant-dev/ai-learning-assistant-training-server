import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, unique, serial } from 'drizzle-orm/pg-core';

// ── 用户 ────────────────────────────────────────────

export const users = pgTable('users', {
  user_id: uuid('user_id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar_url: text('avatar_url'),
  education_level: varchar('education_level', { length: 255 }),
  learning_ability: text('learning_ability'),
  goal: text('goal'),
  level: integer('level'),
  experience: integer('experience'),
  current_title_id: uuid('current_title_id'),
});

// ── 课程安排 ────────────────────────────────────────

export const courseSchedules = pgTable('course_schedule', {
  plan_id: uuid('plan_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  course_id: uuid('course_id').notNull(),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  status: varchar('status', { length: 255 }),
});

// ── 学习记录 ────────────────────────────────────────

export const learningRecords = pgTable('learning_records', {
  task_id: uuid('task_id').defaultRandom().primaryKey(),
  plan_id: uuid('plan_id').notNull(),
  user_id: uuid('user_id').notNull(),
  section_id: uuid('section_id').notNull(),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  status: varchar('status', { length: 255 }),
});

// ── 称号 ────────────────────────────────────────────

export const titles = pgTable('titles', {
  title_id: uuid('title_id').defaultRandom().primaryKey(),
  course_id: uuid('course_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  icon_url: text('icon_url'),
  min_experience_required: integer('min_experience_required'),
  min_section_required: integer('min_section_required'),
  is_default_template: boolean('is_default_template'),
});

// ── AI 对话记录 ─────────────────────────────────────

export const aiInteractions = pgTable('ai_interactions', {
  interaction_id: uuid('interaction_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  section_id: uuid('section_id').notNull(),
  session_id: varchar('session_id', { length: 255 }).notNull(),
  user_message: text('user_message').notNull(),
  ai_response: text('ai_response').notNull(),
  query_time: timestamp('query_time'),
  persona_id_in_use: uuid('persona_id_in_use'),
});

// ── 每日总结 ────────────────────────────────────────

export const dailySummaries = pgTable('daily_summaries', {
  summary_id: uuid('summary_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  summary_date: timestamp('summary_date').notNull(),
  content: text('content').notNull(),
});

// ── 用户会话映射 ────────────────────────────────────

export const userSessionMappings = pgTable('user_session_mapping', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  thread_id: uuid('thread_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  metadata: jsonb('metadata'),
});

// ── 对话分析 ────────────────────────────────────────

export const conversationAnalytics = pgTable('conversation_analytics', {
  id: serial('id').primaryKey(),
  session_id: varchar('session_id', { length: 255 }).notNull(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  conversation_summary: text('conversation_summary'),
  analytics_data: jsonb('analytics_data'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── 用户小节解锁 ────────────────────────────────────

export const userSectionUnlocks = pgTable(
  'user_section_unlock',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    chapter_id: uuid('chapter_id').notNull(),
    section_id: uuid('section_id'),
    unlocked: integer('unlocked').default(0).notNull(),
    duration: integer('duration').default(0).notNull(),
  },
  t => [unique().on(t.user_id, t.chapter_id, t.section_id)],
);

// ── 练习结果 ────────────────────────────────────────

export const exerciseResults = pgTable('exercise_results', {
  result_id: uuid('result_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  exercise_id: uuid('exercise_id').notNull(),
  test_result_id: uuid('test_result_id'),
  user_answer: text('user_answer'),
  score: integer('score'),
  ai_feedback: text('ai_feedback'),
});

// ── 测试结果 ────────────────────────────────────────

export const testResults = pgTable('test_results', {
  result_id: uuid('result_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  test_id: uuid('test_id').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  score: integer('score'),
  ai_feedback: text('ai_feedback'),
});

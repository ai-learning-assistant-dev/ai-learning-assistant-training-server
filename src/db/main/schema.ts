import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// ── AI 人设 ─────────────────────────────────────────

export const aiPersonas = pgTable('ai_personas', {
  persona_id: uuid('persona_id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  prompt: text('prompt').notNull(),
  is_default_template: boolean('is_default_template').default(false).notNull(),
});

// ── 课程 ────────────────────────────────────────────

export const courses = pgTable('courses', {
  course_id: uuid('course_id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  icon_url: text('icon_url'),
  description: text('description'),
  category: varchar('category', { length: 255 }),
  contributors: text('contributors'),
  total_estimated_time: integer('total_estimated_time'),
  default_ai_persona_id: uuid('default_ai_persona_id'),
});

// ── 章节 ────────────────────────────────────────────

export const chapters = pgTable('chapters', {
  chapter_id: uuid('chapter_id').defaultRandom().primaryKey(),
  course_id: uuid('course_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  chapter_order: integer('chapter_order').notNull(),
});

// ── 小节 ────────────────────────────────────────────

export const sections = pgTable('sections', {
  section_id: uuid('section_id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  chapter_id: uuid('chapter_id').notNull(),
  video_url: text('video_url'),
  knowledge_points: jsonb('knowledge_points'),
  video_subtitles: jsonb('video_subtitles'),
  // @deprecated 该字段已废弃，字幕数据已迁移至 video_subtitles (jsonb)
  srt_path: varchar('srt_path', { length: 512 }),
  knowledge_content: text('knowledge_content'),
  estimated_time: integer('estimated_time'),
  section_order: integer('section_order').notNull(),
});

// ── 练习题 ──────────────────────────────────────────

export const exercises = pgTable('exercises', {
  exercise_id: uuid('exercise_id').defaultRandom().primaryKey(),
  section_id: uuid('section_id'),
  question: text('question').notNull(),
  type_status: varchar('type_status', { length: 50 }).notNull(), // 0: 单选, 1: 多选, 2: 简答
  score: integer('score').default(1).notNull(),
  answer: text('answer'),
  image: text('image'),
});

// ── 练习选项 ────────────────────────────────────────

export const exerciseOptions = pgTable('exercise_options', {
  option_id: uuid('option_id').defaultRandom().primaryKey(),
  exercise_id: uuid('exercise_id').notNull(),
  option_text: text('option_text').notNull(),
  is_correct: boolean('is_correct').notNull(),
  image: text('image'),
});

// ── 测试 ────────────────────────────────────────────

export const tests = pgTable('tests', {
  test_id: uuid('test_id').defaultRandom().primaryKey(),
  course_id: uuid('course_id'),
  type_status: varchar('type_status', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
});

// ── 测试-练习关联（复合主键）────────────────────────

export const testExercises = pgTable(
  'test_exercises',
  {
    test_id: uuid('test_id').notNull(),
    exercise_id: uuid('exercise_id').notNull(),
  },
  t => [primaryKey({ columns: [t.test_id, t.exercise_id] })],
);

// ── 引导问题 ────────────────────────────────────────

export const leadingQuestions = pgTable('leading_question', {
  question_id: uuid('question_id').defaultRandom().primaryKey(),
  section_id: uuid('section_id').notNull(),
  question: text('question').notNull(),
});

// ── 系统提示词 ──────────────────────────────────────

export const systemPrompts = pgTable('system_prompts', {
  title: varchar('title', { length: 255 }).primaryKey(),
  prompt_text: text('prompt_text').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

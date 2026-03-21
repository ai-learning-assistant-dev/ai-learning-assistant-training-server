import { z } from 'zod';

/** 课程分类枚举 */
export const COURSE_CATEGORIES = ['职业技能', '文化基础', '工具使用', '人文素养'] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

const courseCategorySchema = z.enum(COURSE_CATEGORIES).optional();

export const createCourseSchema = z.object({
  name: z.string(),
  icon_url: z.string().optional(),
  description: z.string().optional(),
  category: courseCategorySchema,
  contributors: z.string().optional(),
  total_estimated_time: z.number().int().optional(),
  default_ai_persona_id: z.uuid().optional(),
});

export const updateCourseSchema = z.object({
  course_id: z.uuid(),
  name: z.string().optional(),
  icon_url: z.string().optional(),
  description: z.string().optional(),
  category: courseCategorySchema,
  contributors: z.string().optional(),
  total_estimated_time: z.number().int().optional(),
  default_ai_persona_id: z.uuid().optional(),
});

// ── 课程导入 Schema ─────────────────────────────────
// 与 `src/db/main/schema.ts` 主键命名一致：course_id、chapter_id、section_id、exercise_id、option_id、question_id

/** 标准 UUID 或 32 位十六进制（无连字符） */
function normalizeImportUuid(candidate: string | undefined): string | undefined {
  if (candidate == null) return undefined;
  const s = candidate.trim();
  if (s === '') return undefined;
  if (z.uuid().safeParse(s).success) return s;
  const hex = s.replace(/-/g, '');
  if (/^[0-9a-fA-F]{32}$/.test(hex)) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase();
  }
  return undefined;
}

function parseOptionalUuidOrThrow(merged: string | undefined, path: (string | number)[]): string | undefined {
  if (merged === undefined) return undefined;
  const n = normalizeImportUuid(merged);
  if (n === undefined) {
    throw new z.ZodError([{ code: 'custom', path, message: '无效的 UUID' }]);
  }
  return n;
}

const importVideoSubtitleSchema = z.object({
  seq: z.number().int(),
  start: z.string(),
  end: z.string(),
  text: z.string(),
});

const importKnowledgePointSchema = z.object({
  key_points: z.array(
    z.object({
      title: z.string().optional(),
      description: z.string(),
      time: z.string(),
    }),
  ),
});

const importExerciseOptionSchema = z
  .object({
    option_id: z.string().optional(),
    text: z.string(),
    is_correct: z.boolean(),
  })
  .transform(data => ({
    option_id: parseOptionalUuidOrThrow(data.option_id, ['option_id']),
    text: data.text,
    is_correct: data.is_correct,
  }));

/** 将导入的 type 字符串映射为 type_status：0 单选、1 多选、2 简答 */
function mapExerciseTypeToStatus(type: string): string {
  const t = String(type).trim();
  if (t === '0' || t === '单选' || /single|single_choice/i.test(t)) return '0';
  if (t === '1' || t === '多选' || /multiple|multiple_choice/i.test(t)) return '1';
  if (t === '2' || t === '简答' || /short|short_answer/i.test(t)) return '2';
  return '0';
}

const importExerciseSchema = z
  .object({
    exercise_id: z.string().optional(),
    question: z.string(),
    type: z.string(),
    score: z.number().int(),
    options: z.array(importExerciseOptionSchema).optional().default([]),
  })
  .transform(data => ({
    exercise_id: parseOptionalUuidOrThrow(data.exercise_id, ['exercise_id']),
    question: data.question,
    type: mapExerciseTypeToStatus(data.type),
    score: data.score,
    options: data.options,
  }));

const importLeadingQuestionSchema = z
  .object({
    question_id: z.string().optional(),
    question: z.string(),
  })
  .transform(data => ({
    question_id: parseOptionalUuidOrThrow(data.question_id, ['question_id']),
    question: data.question,
  }));

const importSectionSchema = z
  .object({
    section_id: z.string().optional(),
    title: z.string(),
    order: z.number().int(),
    video_url: z.string().optional().default(''),
    knowledge_content: z.string().optional().default(''),
    estimated_time: z.number().int().optional().default(0),
    knowledge_points: importKnowledgePointSchema.optional(),
    video_subtitles: z.array(importVideoSubtitleSchema).optional().default([]),
    exercises: z.array(importExerciseSchema).optional().default([]),
    leading_questions: z.array(importLeadingQuestionSchema).optional().default([]),
  })
  .transform(data => ({
    section_id: parseOptionalUuidOrThrow(data.section_id, ['section_id']),
    title: data.title,
    order: data.order,
    video_url: data.video_url,
    knowledge_content: data.knowledge_content,
    estimated_time: data.estimated_time,
    knowledge_points: data.knowledge_points,
    video_subtitles: data.video_subtitles,
    exercises: data.exercises,
    leading_questions: data.leading_questions,
  }));

const importChapterSchema = z
  .object({
    chapter_id: z.string().optional(),
    course_id: z.string().optional(),
    title: z.string(),
    order: z.number().int(),
    sections: z.array(importSectionSchema).optional().default([]),
  })
  .transform(data => ({
    chapter_id: parseOptionalUuidOrThrow(data.chapter_id, ['chapter_id']),
    title: data.title,
    order: data.order,
    sections: data.sections,
  }));

/**
 * 课程整体导入 schema（解析后仅含与库表一致的主键字段名 `*_id`）。
 * 各层 `*_id` 可选；未提供或无效则插入时由数据库生成。
 */
export const importCourseSchema = z
  .object({
    course_id: z.string().optional(),
    title: z.string(),
    description: z.string().optional().default(''),
    icon_url: z.string().optional().default(''),
    category: z.string().optional().default('职业技能'),
    contributors: z.string().optional().default('志愿者'),
    chapters: z.array(importChapterSchema).optional().default([]),
  })
  .transform(data => ({
    course_id: parseOptionalUuidOrThrow(data.course_id, ['course_id']),
    title: data.title,
    description: data.description,
    icon_url: data.icon_url,
    category: data.category,
    contributors: data.contributors,
    chapters: data.chapters,
  }));

export type ImportCoursePayload = z.output<typeof importCourseSchema>;

export const courseChaptersSectionsRequestSchema = z.object({
  course_id: z.uuid(),
  user_id: z.uuid(),
});

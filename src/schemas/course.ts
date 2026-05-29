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

const importExerciseOptionSchema = z.object({
  option_id: z.uuid(),
  text: z.string(),
  is_correct: z.boolean(),
});

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
    exercise_id: z.uuid(),
    question: z.string(),
    type: z.string(),
    score: z.number().int(),
    options: z.array(importExerciseOptionSchema).optional().default([]),
  })
  .transform(data => ({
    ...data,
    type: mapExerciseTypeToStatus(data.type),
  }));

const importLeadingQuestionSchema = z.object({
  question_id: z.uuid(),
  question: z.string(),
});

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

const importSectionSchema = z.object({
  section_id: z.uuid(),
  title: z.string(),
  order: z.number().int(),
  video_url: z.string().optional().default(''),
  knowledge_content: z.string().optional().default(''),
  estimated_time: z.number().int().optional().default(0),
  knowledge_points: importKnowledgePointSchema.optional(),
  video_subtitles: z.array(importVideoSubtitleSchema).optional().default([]),
  exercises: z.array(importExerciseSchema).optional().default([]),
  leading_questions: z.array(importLeadingQuestionSchema).optional().default([]),
});

const importChapterSchema = z.object({
  chapter_id: z.uuid(),
  title: z.string(),
  order: z.number().int(),
  sections: z.array(importSectionSchema).optional().default([]),
});

const importAiPersonaSchema = z.object({
  persona_id: z.uuid().optional(),
  name: z.string(),
  prompt: z.string(),
  is_default_template: z.boolean().optional().default(false),
});

/** 课程整体导入 schema（主键字段与库表一致：course_id、chapter_id、section_id 等，均为必填） */
export const importCourseSchema = z.object({
  course_id: z.uuid(),
  title: z.string(),
  description: z.string().optional().default(''),
  icon_url: z.string().optional().default(''),
  category: z.string().optional().default('职业技能'),
  contributors: z.string().optional().default('志愿者'),
  ai_persona: importAiPersonaSchema.optional(),
  chapters: z.array(importChapterSchema).optional().default([]),
});

export type ImportCoursePayload = z.output<typeof importCourseSchema>;

export const courseChaptersSectionsRequestSchema = z.object({
  course_id: z.uuid(),
  user_id: z.uuid(),
});

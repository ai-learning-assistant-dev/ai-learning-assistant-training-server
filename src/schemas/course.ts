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
  id: z.string(),
  text: z.string(),
  is_correct: z.boolean(),
});

const importExerciseSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.string(),
  score: z.number().int(),
  options: z.array(importExerciseOptionSchema),
});

const importLeadingQuestionSchema = z.object({
  id: z.string(),
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
  id: z.string(),
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
  id: z.string(),
  title: z.string(),
  order: z.number().int(),
  sections: z.array(importSectionSchema).optional().default([]),
});

/** 课程整体导入 schema（对应 t.ts 中的 c 类型） */
export const importCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  icon_url: z.string().optional().default(''),
  category: z.string().optional().default('职业技能'),
  contributors: z.string().optional().default('志愿者'),
  chapters: z.array(importChapterSchema).optional().default([]),
});

export type ImportCoursePayload = z.infer<typeof importCourseSchema>;

export const courseChaptersSectionsRequestSchema = z.object({
  course_id: z.uuid(),
  user_id: z.uuid(),
});

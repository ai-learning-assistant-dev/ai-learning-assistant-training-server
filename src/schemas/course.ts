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

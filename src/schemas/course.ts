import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string(),
  icon_url: z.string().optional(),
  description: z.string().optional(),
  default_ai_persona_id: z.uuid().optional(),
});

export const updateCourseSchema = z.object({
  course_id: z.uuid(),
  name: z.string().optional(),
  icon_url: z.string().optional(),
  description: z.string().optional(),
  default_ai_persona_id: z.uuid().optional(),
});

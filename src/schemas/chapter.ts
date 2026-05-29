import { z } from 'zod';

export const createChapterSchema = z.object({
  course_id: z.uuid(),
  title: z.string(),
  chapter_order: z.number().int(),
});

export const updateChapterSchema = z.object({
  chapter_id: z.uuid(),
  course_id: z.uuid().optional(),
  title: z.string().optional(),
  chapter_order: z.number().int().optional(),
});

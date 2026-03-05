import { z } from 'zod';

export const createTitleSchema = z.object({
  course_id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
});

export const updateTitleSchema = z.object({
  title_id: z.uuid(),
  course_id: z.uuid().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

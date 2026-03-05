import { z } from 'zod';

export const createTestSchema = z.object({
  course_id: z.uuid().optional(),
  type_status: z.string(),
  title: z.string(),
});

export const updateTestSchema = z.object({
  test_id: z.uuid(),
  course_id: z.uuid().optional(),
  type_status: z.string().optional(),
  title: z.string().optional(),
});

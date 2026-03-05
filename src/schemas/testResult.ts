import { z } from 'zod';

export const createTestResultSchema = z.object({
  user_id: z.uuid(),
  test_id: z.uuid(),
  start_date: z.string(),
  end_date: z.string().optional(),
  score: z.number().int().optional(),
  ai_feedback: z.string().optional(),
});

export const updateTestResultSchema = z.object({
  result_id: z.uuid(),
  user_id: z.uuid().optional(),
  test_id: z.uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  score: z.number().int().optional(),
  ai_feedback: z.string().optional(),
});

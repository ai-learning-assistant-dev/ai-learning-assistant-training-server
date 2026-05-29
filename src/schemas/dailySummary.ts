import { z } from 'zod';

export const createDailySummarySchema = z.object({
  user_id: z.uuid(),
  summary_date: z.string(),
  content: z.string(),
});

export const updateDailySummarySchema = z.object({
  summary_id: z.uuid(),
  content: z.string().optional(),
  summary_date: z.string().optional(),
});

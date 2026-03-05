import { z } from 'zod';

export const createLearningRecordSchema = z.object({
  plan_id: z.uuid(),
  user_id: z.uuid(),
  section_id: z.uuid(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

export const updateLearningRecordSchema = z.object({
  task_id: z.uuid(),
  plan_id: z.uuid().optional(),
  user_id: z.uuid().optional(),
  section_id: z.uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

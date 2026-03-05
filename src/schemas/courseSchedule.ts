import { z } from 'zod';

export const createCourseScheduleSchema = z.object({
  user_id: z.uuid(),
  course_id: z.uuid(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

export const updateCourseScheduleSchema = z.object({
  plan_id: z.uuid(),
  user_id: z.uuid().optional(),
  course_id: z.uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

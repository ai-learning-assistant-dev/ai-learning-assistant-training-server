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

export const getTestsByCourseSchema = z.object({
  course_id: z.uuid(),
});

export const saveTestResultsSchema = z.object({
  user_id: z.uuid(),
  test_id: z.uuid(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  list: z
    .array(
      z.object({
        exercise_id: z.uuid(),
        user_answer: z.string().optional(),
      }),
    )
    .min(1),
});

import { z } from 'zod';

export const saveExerciseResultsSchema = z.object({
  user_id: z.uuid(),
  section_id: z.uuid(),
  test_result_id: z.uuid().optional(),
  list: z
    .array(
      z.object({
        exercise_id: z.uuid(),
        user_answer: z.string().optional(),
      }),
    )
    .min(1),
  duration: z.number().int().optional(),
});

export const getExerciseResultsSchema = z.object({
  user_id: z.uuid(),
  section_id: z.uuid(),
  test_result_id: z.uuid().optional(),
});

export const createExerciseResultSchema = z.object({
  user_id: z.uuid(),
  exercise_id: z.uuid(),
  test_result_id: z.uuid().optional(),
  user_answer: z.string().optional(),
  score: z.number().int().optional(),
  ai_feedback: z.string().optional(),
});

export const updateExerciseResultSchema = z.object({
  result_id: z.uuid(),
  user_id: z.uuid().optional(),
  exercise_id: z.uuid().optional(),
  test_result_id: z.uuid().optional(),
  user_answer: z.string().optional(),
  score: z.number().int().optional(),
  ai_feedback: z.string().optional(),
});

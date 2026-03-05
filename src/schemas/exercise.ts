import { z } from 'zod';

// ── 练习题 ──────────────────────────────────────────

export const createExerciseSchema = z.object({
  section_id: z.uuid().optional(),
  question: z.string(),
  type_status: z.string(),
  score: z.number().int().optional(),
  answer: z.string(),
});

export const updateExerciseSchema = z.object({
  exercise_id: z.uuid(),
  section_id: z.uuid().optional(),
  question: z.string().optional(),
  type_status: z.string().optional(),
  score: z.number().int().optional(),
  answer: z.string().optional(),
});

// ── 练习选项 ────────────────────────────────────────

export const createExerciseOptionSchema = z.object({
  exercise_id: z.uuid(),
  option_text: z.string(),
  is_correct: z.boolean(),
});

export const updateExerciseOptionSchema = z.object({
  option_id: z.uuid(),
  exercise_id: z.uuid().optional(),
  option_text: z.string().optional(),
  is_correct: z.boolean().optional(),
});

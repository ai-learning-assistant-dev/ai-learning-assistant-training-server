import { z } from 'zod';

export const createLeadingQuestionSchema = z.object({
  section_id: z.uuid(),
  question: z.string(),
  answer: z.string(),
});

export const updateLeadingQuestionSchema = z.object({
  question_id: z.uuid(),
  section_id: z.uuid().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
});

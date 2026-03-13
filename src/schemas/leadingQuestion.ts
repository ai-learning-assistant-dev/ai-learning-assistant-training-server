import { z } from 'zod';

export const createLeadingQuestionSchema = z.object({
  section_id: z.uuid(),
  question: z.string().min(1),
});

export const updateLeadingQuestionSchema = z.object({
  question_id: z.uuid(),
  section_id: z.uuid().optional(),
  question: z.string().optional(),
});

export const searchBySectionSchema = z.object({
  section_id: z.uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(20),
});

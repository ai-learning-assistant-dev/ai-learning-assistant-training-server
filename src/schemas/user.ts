import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string(),
  avatar_url: z.string().optional(),
  education_level: z.string().optional(),
  learning_ability: z.string().optional(),
  goal: z.string().optional(),
  level: z.number().int().optional(),
  experience: z.number().int().optional(),
  current_title_id: z.uuid().optional(),
});

export const updateUserSchema = z.object({
  user_id: z.uuid(),
  name: z.string(),
  avatar_url: z.string().optional(),
  education_level: z.string().optional(),
  learning_ability: z.string().optional(),
  goal: z.string().optional(),
  level: z.number().int().optional(),
  experience: z.number().int().optional(),
  current_title_id: z.uuid().optional(),
});

export const userIdRequestSchema = z.object({
  user_id: z.uuid(),
});

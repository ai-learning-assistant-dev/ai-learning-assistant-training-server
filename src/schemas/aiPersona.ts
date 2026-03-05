import { z } from 'zod';

export const createAiPersonaSchema = z.object({
  name: z.string(),
  prompt: z.string(),
  is_default_template: z.boolean().optional(),
});

export const updateAiPersonaSchema = z.object({
  persona_id: z.uuid(),
  name: z.string().optional(),
  prompt: z.string().optional(),
  is_default_template: z.boolean().optional(),
});

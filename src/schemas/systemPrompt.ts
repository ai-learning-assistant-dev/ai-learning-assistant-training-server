import { z } from 'zod';

export const updateSystemPromptSchema = z.object({
  prompt_text: z.string(),
});

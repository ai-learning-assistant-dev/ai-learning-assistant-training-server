import { z } from 'zod';

export const createAiInteractionSchema = z.object({
  user_id: z.uuid(),
  section_id: z.uuid(),
  session_id: z.string(),
  user_message: z.string(),
  ai_response: z.string(),
  query_time: z.string().optional(),
  persona_id_in_use: z.uuid().optional(),
});

export const updateAiInteractionSchema = z.object({
  interaction_id: z.uuid(),
  user_id: z.uuid().optional(),
  section_id: z.uuid().optional(),
  session_id: z.string().optional(),
  user_message: z.string().optional(),
  ai_response: z.string().optional(),
  query_time: z.string().optional(),
  persona_id_in_use: z.uuid().optional(),
});

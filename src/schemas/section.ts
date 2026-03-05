import { z } from 'zod';

export const createSectionSchema = z.object({
  title: z.string(),
  chapter_id: z.uuid(),
  section_order: z.number().int(),
  video_url: z.string().optional(),
  knowledge_points: z.unknown().optional(),
  video_subtitles: z.unknown().optional(),
  knowledge_content: z.string().optional(),
  estimated_time: z.number().int().optional(),
});

export const updateSectionSchema = z.object({
  section_id: z.uuid(),
  title: z.string().optional(),
  chapter_id: z.uuid().optional(),
  section_order: z.number().int().optional(),
  video_url: z.string().optional(),
  knowledge_points: z.unknown().optional(),
  video_subtitles: z.unknown().optional(),
  knowledge_content: z.string().optional(),
  estimated_time: z.number().int().optional(),
});

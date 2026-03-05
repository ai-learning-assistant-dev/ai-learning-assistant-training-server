import { z } from 'zod';

// ── 推断类型导出 ────────────────────────────────────

export type AnswerEvaluateRequest = z.infer<typeof answerEvaluateRequestSchema>;
export type LearningReviewRequest = z.infer<typeof learningReviewRequestSchema>;

export interface AnswerEvaluateResponse {
  reply: string;
  score: number;
}

// ── 非流式聊天 ──────────────────────────────────────

export const chatRequestSchema = z.object({
  userId: z.uuid(),
  sectionId: z.union([z.uuid(), z.literal('')]),
  message: z.string(),
  personaId: z.uuid().optional(),
  sessionId: z.string().optional(),
  modelName: z.string().optional(),
  reasoning: z.boolean().optional(),
});

// ── 流式聊天 ────────────────────────────────────────

export const streamChatRequestSchema = z.object({
  userId: z.uuid().optional(),
  sectionId: z.union([z.uuid(), z.literal('')]).optional(),
  message: z.string(),
  personaId: z.uuid().optional(),
  sessionId: z.string().optional(),
  useAudio: z.boolean().optional(),
  ttsOption: z.array(z.string()).optional(),
  daily: z.boolean().optional(),
  modelName: z.string().optional(),
  reasoning: z.boolean().optional(),
});

// ── 答案评估 ────────────────────────────────────────

export const answerEvaluateRequestSchema = z.object({
  studentAnswer: z.string(),
  question: z.string(),
  standardAnswer: z.string(),
  priorKnowledge: z.string().optional(),
  prompt: z.string().optional(),
});

// ── 学习评语 ────────────────────────────────────────

export const learningReviewRequestSchema = z.object({
  userId: z.uuid(),
  sectionId: z.uuid(),
  sessionId: z.string(),
  modelName: z.string().optional(),
});

// ── 会话创建 ────────────────────────────────────────

export const createSessionRequestSchema = z.object({
  userId: z.uuid(),
  sectionId: z.union([z.uuid(), z.literal('')]),
  personaId: z.uuid().optional(),
});

// ── 切换人设 ────────────────────────────────────────

export const switchPersonaSchema = z.object({
  sessionId: z.string(),
  personaId: z.uuid(),
});

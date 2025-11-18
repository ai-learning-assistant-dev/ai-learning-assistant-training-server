import { Readable } from "stream";

// 简易聊天，用于AI简答题评价。
export interface AnswerEvaluateRequest {
  studentAnswer: string;
  prompt?: string;
  priorKnowledge?: string;
  question: string;
  standardAnswer: string;
}

export interface AnswerEvaluateResponse {
  reply: string;
  score: number;
}

// 每日聊天，上下文存储于内存中，用于主页会话。
export interface DailyChatRequest {
  message: string;
}

export interface DailyChatResponse {
  ai_response: Readable
}

/**
 * AI聊天接口请求体
 */
 export interface ChatRequest {
  userId: string;
  sectionId: string;
  message: string;
  personaId?: string;
  sessionId?: string;
}

/**
 * 流式聊天接口请求体
 */
export interface StreamChatRequest {
  userId: string;
  sectionId: string;
  message: string;
  personaId?: string;
  sessionId?: string;
  useAudio?: boolean;
  ttsOption?: string[];
  daily?: boolean;
}

/**
 * 会话创建请求体
 */
export interface CreateSessionRequest {
  userId: string;
  sectionId: string;
  personaId?: string;
}

/**
 * AI聊天响应
 */
export interface ChatResponse {
  interaction_id: string;
  user_id: string;
  section_id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  query_time: Date;
  persona_id_in_use?: string;
}

/**
 * AI流式聊天响应
 */
export interface ChatStreamlyResponse {
  interaction_id: string;
  user_id: string;
  section_id: string;
  session_id: string;
  user_message: string;
  ai_response: Readable;
  query_time: Date;
  persona_id_in_use?: string;
}

/**
 * 会话信息
 */
export interface SessionInfo {
  session_id: string;
  user_id: string;
  section_id: string;
  persona_id?: string;
  created_at: Date;
}

/**
 * 单个会话的详细信息
 */
export interface SessionDetail {
  session_id: string;
  interaction_count: number;
  first_interaction: Date;
  last_interaction: Date;
}

/**
 * 用户章节会话列表响应
 */
export interface UserSectionSessionsResponse {
  user_id: string;
  section_id: string;
  session_count: number;
  sessions: SessionDetail[];
}

/**
 * 学习总结评语请求
 */
export interface LearningReviewRequest {
  userId: string;
  sectionId: string;
  sessionId: string;
}

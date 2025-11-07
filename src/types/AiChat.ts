import { Readable } from "stream";

// 简易聊天，用于AI简答题评价。
interface AnswerEvaluateRequest {
  studentAnswer: string;
  prompt?: string;
  priorKnowledge?: string;
  question: string;
  standardAnswer: string;
}

interface AnswerEvaluateResponse {
  reply: string;
  score: number;
}

// 每日聊天，上下文存储于内存中，用于主页会话。
export interface DailyChatRequest {
  message: string;
}

interface DailyChatResponse {
  ai_response: Readable
}

/**
 * AI聊天接口请求体
 */
 interface ChatRequest {
  userId: string;
  sectionId: string;
  message: string;
  personaId?: string;
  sessionId?: string;
}

/**
 * 流式聊天接口请求体
 */
interface StreamChatRequest {
  userId: string;
  sectionId: string;
  message: string;
  personaId?: string;
  sessionId?: string;
}

/**
 * 会话创建请求体
 */
 interface CreateSessionRequest {
  userId: string;
  sectionId: string;
  personaId?: string;
}

/**
 * AI聊天响应
 */
 interface ChatResponse {
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
interface ChatStreamlyResponse {
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
 interface SessionInfo {
  session_id: string;
  user_id: string;
  section_id: string;
  persona_id?: string;
  created_at: Date;
}

/**
 * 单个会话的详细信息
 */
interface SessionDetail {
  session_id: string;
  interaction_count: number;
  first_interaction: Date;
  last_interaction: Date;
}

/**
 * 用户章节会话列表响应
 */
interface UserSectionSessionsResponse {
  user_id: string;
  section_id: string;
  session_count: number;
  sessions: SessionDetail[];
}

export {
  ChatRequest,
  StreamChatRequest,
  CreateSessionRequest,
  ChatResponse,
  ChatStreamlyResponse,
  SessionInfo,
  SessionDetail,
  UserSectionSessionsResponse,
  AnswerEvaluateRequest,
  AnswerEvaluateResponse
};

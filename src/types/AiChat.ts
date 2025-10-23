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
 * 会话信息
 */
export interface SessionInfo {
  session_id: string;
  user_id: string;
  section_id: string;
  persona_id?: string;
  created_at: Date;
}

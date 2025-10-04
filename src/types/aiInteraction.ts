export interface AiInteractionResponse {
  interaction_id: string;
  user_id: string;
  section_id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  query_time?: Date;
  persona_id_in_use?: string;
  persona_id?: string;
}

export interface CreateAiInteractionRequest {
  user_id: string;
  section_id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  query_time?: Date;
  persona_id_in_use?: string;
  persona_id?: string;
}

export interface UpdateAiInteractionRequest {
  interaction_id: string;
  user_id?: string;
  section_id?: string;
  session_id?: string;
  user_message?: string;
  ai_response?: string;
  query_time?: Date;
  persona_id_in_use?: string;
  persona_id?: string;
}

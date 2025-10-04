export interface AiPersonaResponse {
  persona_id: string;
  name: string;
  prompt: string;
  is_default_template: boolean;
}

export interface CreateAiPersonaRequest {
  name: string;
  prompt: string;
  is_default_template?: boolean;
}

export interface UpdateAiPersonaRequest {
  persona_id: string;
  name?: string;
  prompt?: string;
  is_default_template?: boolean;
}

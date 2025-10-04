export interface LeadingQuestionResponse {
  question_id: string;
  section_id: string;
  question: string;
  // 如模型没有 answer 字段可去掉
}

export interface CreateLeadingQuestionRequest {
  section_id: string;
  question: string;
  answer: string;
}

export interface UpdateLeadingQuestionRequest {
  question_id: string;
  section_id?: string;
  question?: string;
  answer?: string;
}

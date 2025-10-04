export interface TestResultResponse {
  result_id: string;
  user_id: string;
  test_id: string;
  start_date: Date;
  end_date?: Date;
  score?: number;
  ai_feedback?: string;
}

export interface CreateTestResultRequest {
  user_id: string;
  test_id: string;
  start_date: Date;
  end_date?: Date;
  score?: number;
  ai_feedback?: string;
}

export interface UpdateTestResultRequest {
  result_id: string;
  user_id?: string;
  test_id?: string;
  start_date?: Date;
  end_date?: Date;
  score?: number;
  ai_feedback?: string;
}

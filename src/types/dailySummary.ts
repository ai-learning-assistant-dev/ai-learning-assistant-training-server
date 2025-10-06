export interface DailySummaryResponse {
  summary_id: string;
  user_id: string;
  summary_date: Date; 
  content: string;
}

export interface CreateDailySummaryRequest {
  user_id: string;
  summary_date: Date; 
  content: string;
}

export interface UpdateDailySummaryRequest {
  summary_id: string;
  content?: string;
  summary_date?: Date; 
}

export interface DailySummaryListRequest {
  user_id?: string;
  summary_date?: Date; 
  page?: number;
  limit?: number;
}

export interface DailySummaryResponse {
  summary_id: number;
  user_id: number;
  summary_date: Date; 
  content: string;
}

export interface CreateDailySummaryRequest {
  user_id: number;
  summary_date: Date; 
  content: string;
}

export interface UpdateDailySummaryRequest {
  summary_id: number;
  content?: string;
  summary_date?: Date; 
}

export interface DailySummaryListRequest {
  user_id?: number;
  summary_date?: Date; 
  page?: number;
  limit?: number;
}

export interface DailySummaryResponse {
  summary_id: number;
  user_id: number;
  summary_date: string; // ISO 字符串
  content: string;
}

export interface CreateDailySummaryRequest {
  user_id: number;
  summary_date: string; // ISO 字符串
  content: string;
}

export interface UpdateDailySummaryRequest {
  summary_id: number;
  content?: string;
  summary_date?: string; // ISO 字符串
}

export interface DailySummaryListRequest {
  user_id?: number;
  summary_date?: string; // ISO 字符串
  page?: number;
  limit?: number;
}

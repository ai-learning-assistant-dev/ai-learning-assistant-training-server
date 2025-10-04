export interface TitleResponse {
  title_id: string;
  course_id: string;
  name: string;
  description?: string;
}

export interface CreateTitleRequest {
  course_id: string;
  name: string;
  description?: string;
}

export interface UpdateTitleRequest {
  title_id: string;
  course_id?: string;
  name?: string;
  description?: string;
}

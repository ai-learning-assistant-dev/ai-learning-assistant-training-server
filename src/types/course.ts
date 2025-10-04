export interface CourseResponse {
  course_id: string;
  name: string;
  icon_url?: string;
  description?: string;
  default_ai_persona_id?: string;
}

export interface CreateCourseRequest {
  name: string;
  icon_url?: string;
  description?: string;
  default_ai_persona_id?: string;
}

export interface UpdateCourseRequest {
  course_id: string;
  name?: string;
  icon_url?: string;
  description?: string;
  default_ai_persona_id?: string;
}

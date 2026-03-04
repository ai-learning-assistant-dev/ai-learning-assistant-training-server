export type CourseCategory = '职业技能' | '文化基础' | '工具使用' | '人文素养';

export interface CourseResponse {
  course_id: string;
  name: string;
  icon_url?: string;
  description?: string;
  category?: CourseCategory;
  default_ai_persona_id?: string;
  contributors?: string;
  total_estimated_time?: number;
}

export interface CreateCourseRequest {
  name: string;
  icon_url?: string;
  description?: string;
  category?: CourseCategory;
  default_ai_persona_id?: string;
  contributors?: string;
  total_estimated_time?: number;
}

export interface UpdateCourseRequest {
  course_id: string;
  name?: string;
  icon_url?: string;
  description?: string;
  category?: CourseCategory;
  default_ai_persona_id?: string;
  contributors?: string;
  total_estimated_time?: number;
}

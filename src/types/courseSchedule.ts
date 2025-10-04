export interface CourseScheduleResponse {
  plan_id: string;
  user_id: string;
  course_id: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface CreateCourseScheduleRequest {
  user_id: string;
  course_id: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface UpdateCourseScheduleRequest {
  plan_id: string;
  user_id?: string;
  course_id?: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface LearningRecordResponse {
  task_id: string;
  plan_id: string;
  user_id: string;
  section_id: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface CreateLearningRecordRequest {
  plan_id: string;
  user_id: string;
  section_id: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface UpdateLearningRecordRequest {
  task_id: string;
  plan_id?: string;
  user_id?: string;
  section_id?: string;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

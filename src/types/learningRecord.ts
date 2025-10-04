export interface LearningRecordResponse {
  task_id: number;
  plan_id: number;
  user_id: number;
  section_id: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface CreateLearningRecordRequest {
  plan_id: number;
  user_id: number;
  section_id: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

export interface UpdateLearningRecordRequest {
  task_id: number;
  plan_id?: number;
  user_id?: number;
  section_id?: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

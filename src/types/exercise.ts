export interface ExerciseResponse {
  exercise_id: string;
  section_id?: string;
  question: string;
  type_status: string;
  score: number;
  answer: string;
}

export interface CreateExerciseRequest {
  section_id?: string;
  question: string;
  type_status: string;
  score?: number;
  answer: string;
}

export interface UpdateExerciseRequest {
  exercise_id: string;
  section_id?: string;
  question?: string;
  type_status?: string;
  score?: number;
  answer?: string;
}

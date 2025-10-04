export interface ExerciseOptionResponse {
  option_id: string;
  exercise_id: string;
  option_text: string;
  is_correct: boolean;
}

export interface CreateExerciseOptionRequest {
  exercise_id: string;
  option_text: string;
  is_correct: boolean;
}

export interface UpdateExerciseOptionRequest {
  option_id: string;
  exercise_id?: string;
  option_text?: string;
  is_correct?: boolean;
}

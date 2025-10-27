// 批量保存答题结果的单项类型
export interface SaveExerciseResultItem {
  result_id?: any; // 有则为更新，无则为新增
  user_id: string;
  exercise_id: string;
  user_answer?: string;
  score?: number;
  ai_feedback?: string;
  test_result_id?: any;
}
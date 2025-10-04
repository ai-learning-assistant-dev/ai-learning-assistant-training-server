export interface TestResponse {
  test_id: string;
  course_id?: string;
  type_status: string;
  title: string;
}

export interface CreateTestRequest {
  course_id?: string;
  type_status: string;
  title: string;
}

export interface UpdateTestRequest {
  test_id: string;
  course_id?: string;
  type_status?: string;
  title?: string;
}

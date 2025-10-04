// UUID 类型统一用 string 表示，避免 tsoa 解析错误

// 用户相关的 DTO（数据传输对象）
export interface UserResponse {
  user_id:string;
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
  // 可根据 User 模型补充 dailySummaries、courseSchedules、learningRecords、aiInteractions 等关联字段

// ...existing code...
export interface CreateUserRequest {
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: string;
}

export interface UpdateUserRequest {
  user_id: string;
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  active?: boolean;
  username?: string;
  email?: string;
}


// 查询参数类型
export interface UserQueryParams {
  page?: number;
  limit?: number;
  active?: boolean;
  username?: string;
  email?: string;
}
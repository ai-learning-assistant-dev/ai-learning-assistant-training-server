// 用户相关的 DTO（数据传输对象）
export interface UserResponse {
  user_id: number;
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserRequest {
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: number;
}

export interface UpdateUserRequest {
  user_id: number;
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: number;
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
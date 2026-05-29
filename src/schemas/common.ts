import { z } from 'zod';

// ── 分页 ────────────────────────────────────────────

export const searchSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(20),
});

export type SearchParams = z.infer<typeof searchSchema>;

// ── 统一响应类型 ────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
  pagination?: Pagination;
}

// ── 响应构建函数 ────────────────────────────────────

/** 截取超长文本，保留前后各一部分 */
export function truncateText(text: string, maxLen = 500): string {
  if (text.length <= maxLen) return text;
  const keep = Math.floor((maxLen - 20) / 2);
  return `${text.slice(0, keep)} ...(省略 ${text.length - keep * 2} 字符)... ${text.slice(-keep)}`;
}

export function ok<T>(data: T, message = '成功', pagination?: Pagination): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    ...(pagination ? { pagination } : {}),
  };
}

export function fail(error: string, details?: unknown): ApiResponse {
  return {
    success: false,
    error,
    ...(details !== undefined ? { details: typeof details === 'string' ? truncateText(details) : details } : {}),
  };
}

export function paginate<T>(rows: T[], total: number, page: number, limit: number, message = '查询成功'): ApiResponse<T[]> {
  return ok(rows, message, { page, limit, total });
}

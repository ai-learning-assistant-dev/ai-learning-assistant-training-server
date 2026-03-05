/**
 * OpenAPI 文档辅助函数
 *
 * 提供可复用的请求/响应 schema 构建器，减少 describeRoute 样板代码。
 */
import { z } from 'zod';
import { resolver } from 'hono-openapi';

// ── 通用响应 Schema ─────────────────────────────────

/** ApiResponse<T> 成功响应的 Zod schema */
export const apiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    })
    .optional(),
});

/** ApiResponse 错误响应的 Zod schema */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

// ── 构建器函数 ──────────────────────────────────────

/** 构建 JSON 请求体 OpenAPI 描述 */
export function jsonBody(schema: z.ZodType) {
  return {
    required: true as const,
    content: { 'application/json': { schema: resolver(schema) } },
  };
}

/** 构建 JSON 响应 OpenAPI 描述 */
export function jsonResponse(description: string, schema?: z.ZodType) {
  if (!schema) return { description };
  return {
    description,
    content: { 'application/json': { schema: resolver(schema) } },
  };
}

/** 成功 + 错误响应的标准组合 */
export function standardResponses(successDesc = '操作成功') {
  return {
    200: jsonResponse(successDesc, apiSuccessSchema),
    400: jsonResponse('请求参数错误', apiErrorSchema),
    404: jsonResponse('资源未找到', apiErrorSchema),
  };
}

/** 分页查询的标准响应 */
export function paginatedResponses(entityDesc: string) {
  return {
    200: jsonResponse(`${entityDesc}分页查询结果`, apiSuccessSchema),
    400: jsonResponse('请求参数错误', apiErrorSchema),
  };
}

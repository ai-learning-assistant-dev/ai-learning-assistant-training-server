import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import { isAPIKeyEmpty } from '../llm/utils/modelConfigManager';
import { truncateText } from '../schemas/common';
import logger from '../utils/logger';
import { LLMSettingsError } from './llmSettingsError';

/** 统一 API 响应类型 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

/** 404 处理 */
export const onNotFound = (c: Context): Response => {
  const response: ApiResponse = {
    success: false,
    error: `路由 ${c.req.method} ${c.req.path} 不存在`,
  };
  return c.json(response, 404);
};

/** 全局错误处理 */
export const onError = async (err: Error, c: Context): Promise<Response> => {
  const method = c.req.method;
  const path = c.req.path;

  // Zod 验证错误 — 单独处理以提供详细校验信息
  if (err.name === 'ZodError') {
    const issues = (err as any).issues ?? [];
    const fields = issues.map((i: any) => `${i.path?.join('.')}: ${i.message}`).join('; ');

    // 尝试记录请求参数（c.req.json() 在 Hono 中有缓存），超长时截取
    let bodyLog = '';
    try {
      const body = await c.req.json();
      bodyLog = ` | 请求参数: ${truncateText(JSON.stringify(body))}`;
    } catch {
      // body 不可读（GET 请求等）
    }
    logger.warn(`[${method} ${path}] 参数校验失败: ${fields}${bodyLog}`);

    // 对客户端返回简化的校验信息（字段名+错误描述），不暴露完整 schema 结构
    const sanitizedIssues = issues.map((i: any) => ({
      field: i.path?.join('.') || '',
      message: i.message,
    }));

    const response: ApiResponse = {
      success: false,
      error: `请求参数验证失败: ${fields}`,
      details: sanitizedIssues,
    };
    return c.json(response, 400);
  }

  // 其他错误 — 打印完整上下文
  logger.error(`[${method} ${path}] ${err.name}: ${truncateText(err.message)}`);
  if (err.stack) {
    logger.error(err.stack);
  }

  let statusCode: StatusCode = 500;
  let errorMessage = '服务器内部错误';

  // LLM 配置错误
  if (err instanceof LLMSettingsError) {
    statusCode = 400;
    errorMessage = 'AI 模型配置错误，请检查模型设置';
  }
  // 数据库错误
  else if (err.name?.includes('DrizzleError') || err.name?.includes('PostgresError')) {
    statusCode = 400;
    errorMessage = '数据库操作失败';
  }
  // 大模型认证错误
  else if (err.name?.includes('AuthenticationError')) {
    statusCode = 400;
    errorMessage = '大模型认证失败，请检查配置的 API Key 是否正确';
  }

  if (isAPIKeyEmpty === true) {
    statusCode = 400;
    errorMessage = '检测到服务器错误，很可能是未正确配置大模型，请参考使用手册进行配置';
  }

  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? truncateText(err.message) : undefined,
  };

  return c.json(response, statusCode);
};

import 'dotenv/config';
import { Hono } from 'hono';

import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { onError, onNotFound } from './middleware/errorHandler';
import logger from './utils/logger';
import api from './routes';
import docs from './routes/docs';

import { initializeDatabase, createInitialData, closeDatabase } from './db';

const app = new Hono();

// ── 中间件 ────────────────────────────────────────────

app.use(
  '*',
  cors({
    origin: ['http://127.0.0.1:3000', 'http://127.0.0.1:7100', 'http://127.0.0.1:8989'],
  }),
);
app.use('*', secureHeaders());

// ── 错误响应日志中间件 ────────────────────────────────
// 记录所有 4xx/5xx 响应到日志（不含 Zod 校验错误，已在 errorHandler 中处理）
app.use('*', async (c, next) => {
  await next();
  if (c.res.status >= 400 && c.error == null) {
    try {
      const cloned = c.res.clone();
      const body = (await cloned.json()) as Record<string, unknown>;
      if (body && !body.success) {
        let reqParams = '';
        try {
          const reqBody = await c.req.json();
          reqParams = ` | 请求参数: ${JSON.stringify(reqBody)}`;
        } catch {
          // GET 等无 body 请求
          const query = c.req.query();
          if (Object.keys(query).length > 0) {
            reqParams = ` | 查询参数: ${JSON.stringify(query)}`;
          }
        }
        logger.warn(`[${c.req.method} ${c.req.path}] ${c.res.status}: ${body.error ?? ''}${reqParams}`);
      }
    } catch {
      // 非 JSON 响应，忽略
    }
  }
});

// ── 健康检查 ──────────────────────────────────────────

app.get('/health', c => {
  return c.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── 业务路由 ──────────────────────────────────────────

app.route('/api', api);

// ── API 文档 ──────────────────────────────────────────

app.route('/docs', docs);

// ── 错误处理 ──────────────────────────────────────────

app.notFound(onNotFound);
app.onError(onError);

// ── 启动服务器 ────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    await createInitialData();

    // Bun 原生 HTTP 服务 / Node.js 兼容
    if (typeof Bun !== 'undefined') {
      Bun.serve({ port: PORT, fetch: app.fetch });
    } else {
      const { serve } = await import('@hono/node-server');
      serve({ fetch: app.fetch, port: PORT });
    }

    logger.info(`🚀 服务器运行在端口 ${PORT}`);
    logger.info(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 健康检查: http://localhost:${PORT}/health`);
    logger.info(`📚 API接口文档: http://localhost:${PORT}/docs`);
  } catch (error) {
    logger.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// ── 进程信号处理 ──────────────────────────────────────

const shutdown = async () => {
  logger.info('🛑 正在关闭服务器...');
  await closeDatabase();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', error => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  logger.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

startServer();

export { app };

/**
 * API 文档路由
 *
 * 使用 hono-openapi 自动扫描路由树生成 OpenAPI 规范，
 * 通过 @hono/swagger-ui 提供交互式文档界面。
 *
 * 渐进式文档化：
 * - 当前：includeEmptyPaths 展示所有路由骨架
 * - 后续：逐个路由添加 describeRoute + validator 中间件丰富详情
 */
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import api from './index';

const docs = new Hono();

// ── OpenAPI 规范（自动生成） ─────────────────────────

docs.get(
  '/openapi.json',
  openAPIRouteHandler(api, {
    documentation: {
      info: {
        title: 'AI Learning Assistant Training Server API',
        version: '1.0.0',
        description: 'AI 辅助学习平台后端服务 API 文档',
      },
      servers: [{ url: '/api', description: '默认服务' }],
      tags: [
        { name: '课程管理', description: '课程、章节、小节' },
        { name: '练习与测试', description: '练习、选项、答题结果、测试' },
        { name: '用户与学习', description: '用户、学习记录、课程安排、称号、每日总结' },
        { name: 'AI 聊天', description: '学习助手对话、每日聊天、答案评估、学习总结' },
        { name: 'AI 管理', description: 'AI 交互记录、人设、系统提示词' },
        { name: 'B站代理', description: 'Bilibili 视频流/登录代理' },
      ],
    },
    includeEmptyPaths: true,
  }),
);

// ── Swagger UI ──────────────────────────────────────

docs.get(
  '/',
  swaggerUI({
    url: '/docs/openapi.json',
  }),
);

export default docs;

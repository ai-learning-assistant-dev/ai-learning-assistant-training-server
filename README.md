# AI Learning Assistant Training Server

面向教育场景的 AI 辅助学习平台后端服务，支持课程管理、AI 对话（流式/非流式）、答案评估、学习进度跟踪、学习总结生成等功能。

## 技术栈

| 技术                      | 用途                                        |
| ------------------------- | ------------------------------------------- |
| **Bun**                   | 运行时（Bun 优先，保留 Node.js 兼容）       |
| **Hono**                  | Web 框架                                    |
| **Drizzle ORM**           | 数据库 ORM（schema-as-code）                |
| **PGlite**                | 嵌入式 PostgreSQL（进程内模式，零外部依赖） |
| **Zod**                   | 请求校验 + 类型定义                         |
| **LangChain + LangGraph** | LLM 框架（多 Provider 支持）                |
| **hono-openapi**          | OpenAPI 文档自动生成                        |

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发模式（热重载）

```bash
bun dev
```

服务启动后：

- 健康检查：http://localhost:3000/health
- API 文档：http://localhost:3000/docs

### 数据库初始化

项目使用 PGlite 嵌入式 PostgreSQL，**无需安装或配置外部数据库**，首次启动自动初始化。

```bash
bun run db:init        # 手动初始化（通常无需执行）
bun run db:import      # 从 db.sql 导入数据
```

### 类型检查

```bash
bun typecheck
```

### 生产构建

```bash
bun build              # tsdown 输出到 dist/
bun start              # 运行 dist/app.mjs
bun run build:bun      # Bun 单文件编译
```

## 项目结构

```
src/
├── app.ts              # 入口：Hono 配置、中间件、Bun.serve() 启动
├── routes/             # 路由定义（~20 个路由文件 + CRUD 工厂）
│   ├── index.ts        # 路由注册 + ApiType 类型导出
│   ├── _crud.ts        # CRUD 工厂（自动生成 5 个标准端点）
│   └── docs.ts         # OpenAPI / Swagger UI
├── db/                 # Drizzle schema + 数据库初始化
│   ├── main/           # 主库 schema（课程、练习、AI 人设等）
│   └── user/           # 用户库 schema（用户、学习记录、会话等）
├── schemas/            # Zod 校验 schema + TypeScript 类型
├── services/           # 业务服务层
├── llm/
│   ├── agent/          # LangGraph ReactAgent 封装
│   ├── domain/         # AI 业务对象（学习助手、答案评估等）
│   ├── prompt/         # 提示词管理（默认模板 + DB 覆盖）
│   ├── storage/        # 会话持久化存储
│   ├── tool/           # LangChain 工具（SRT 字幕读取等）
│   └── utils/          # LLM 工厂 + 模型配置
├── middleware/          # 错误处理中间件
├── config/             # LLM JSON 配置
├── scripts/            # 数据库初始化与种子数据
└── utils/              # 日志、路径、HTTP 客户端
```

## 双数据库架构

项目使用两个独立的 PGlite 实例，进程内运行：

| 数据库     | 内容               | 实体示例                                                          |
| ---------- | ------------------ | ----------------------------------------------------------------- |
| **mainDb** | 课程结构与静态内容 | Course, Chapter, Section, Exercise, AiPersona, SystemPrompt       |
| **userDb** | 用户相关动态数据   | User, LearningRecord, DailySummary, AiInteraction, ExerciseResult |

数据分离设计便于独立备份/迁移，避免用户数据影响内容数据。Docker 部署时可切换为标准 PostgreSQL。

## API 文档

- **交互式文档**：启动服务后访问 http://localhost:3000/docs（Swagger UI）
- **OpenAPI JSON**：`GET /docs/openapi.json`
- **详细接口说明**：见 [docs/API.md](docs/API.md)

## 前端类型集成

服务端通过 `src/routes/index.ts` 导出 Hono RPC 类型 `ApiType`，前端可借助 `hono/client` 获得路由路径补全与类型推断。

### 前端安装

```bash
bun add hono
```

### 使用示例

```ts
import { hc } from 'hono/client';
import type { ApiType } from 'ai-learning-assistant-training-server/src/routes';

const client = hc<ApiType>('http://localhost:3000/api');

// 路径自动补全 + 类型推断
const res = await client.courses.search.$post({ json: { page: 1, limit: 20 } });
const data = await res.json();
```

### tsconfig 配置

前端项目需配置路径别名以解析服务端类型：

```jsonc
{
  "compilerOptions": {
    "paths": {
      // Monorepo workspace 方式
      "ai-learning-assistant-training-server/*": ["../server/*"],
    },
  },
}
```

若非 monorepo，也可使用 `npm link` 或直接将服务端类型定义复制到前端项目中。

详细 API 接口文档参见 [docs/API.md](docs/API.md#前端类型集成)。

## 常用命令

| 命令                     | 说明                  |
| ------------------------ | --------------------- |
| `bun dev`                | 开发模式（热重载）    |
| `bun typecheck`          | TypeScript 类型检查   |
| `bun build`              | 生产构建              |
| `bun start`              | 运行构建产物          |
| `bun run db:import`      | 从 db.sql 导入数据    |
| `bun run db:generate`    | 生成 Drizzle 迁移     |
| `bun run db:studio:main` | 主库 Drizzle Studio   |
| `bun run db:studio:user` | 用户库 Drizzle Studio |

## LLM 多模型支持

通过 `src/config/llm-config.json` 配置，支持以下 Provider：

- OpenAI / Azure OpenAI
- Anthropic (Claude)
- Google Gemini
- Ollama (本地模型)
- DeepSeek
- 豆包 (Volcengine)

在 `.env` 中配置对应 API Key 即可启用。

## 容器部署

```bash
# 导出数据库
pg_dump -h localhost -p 5432 -U postgres -C ai_learning_assistant -F p -f container-script/ai_learning_assistant.sql

# Docker 构建（多阶段构建，自动携带数据）
docker build -t ai-learning-assistant .
```

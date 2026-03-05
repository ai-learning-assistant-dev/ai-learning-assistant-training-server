# 项目重构迁移文档

## 1. 重构目标

将项目从 Express + tsoa + TypeORM（装饰器驱动）架构，迁移至纯 ESM + 无装饰器的现代 TypeScript 栈，优先支持 Bun 运行时。

### 1.1 核心变更

| 维度       | 当前                        | 目标                          |
| ---------- | --------------------------- | ----------------------------- |
| Web 框架   | Express 4 + tsoa 装饰器路由 | Hono + @hono/zod-openapi      |
| ORM        | TypeORM 0.3（装饰器实体）   | Drizzle ORM（schema-as-code） |
| 类型校验   | tsoa 内置                   | Zod                           |
| 客户端生成 | 无                          | Hono RPC（类型推断）          |
| API 文档   | tsoa → swagger.json         | @hono/zod-openapi → OpenAPI   |
| 日志       | Winston + Morgan + console  | consola（统一 + 文件持久化）  |
| 运行时     | Node.js 优先                | Bun 优先                      |
| 装饰器     | 全面使用                    | 完全移除                      |
| 数据库连接 | PGlite Worker + pg 驱动     | PGlite 进程内直连             |
| 数据库版本 | synchronize: true           | Drizzle Kit 迁移 + 自动升级   |

### 1.2 运行环境

项目当前作为 **Electron 子进程**运行在用户本地 Windows 上。未来可能拆分为：

- **本地后端**：用户数据存储（UserDB），运行在客户端本地
- **云端公共服务器**：公共内容数据（MainDB），供移动端等多客户端访问

架构设计需兼顾这一演进方向。

### 1.3 设计原则

- **Zod schema 作为 single source of truth**：请求校验、响应类型、OpenAPI 文档均从 Zod schema 派生
- **无装饰器**：所有定义（路由、数据库表、校验）均使用函数式 API
- **Bun 优先**：开发和生产均以 Bun 为主运行时，保留 Node.js 兼容
- **渐进式迁移**：分阶段进行，每阶段可独立验证
- **客户端可升级**：数据库 schema 版本化管理，支持客户端版本更新时自动迁移数据

---

## 2. 技术选型详情

### 2.1 Hono（Web 框架）

**选型理由**：

- Node.js 兼容性好（PGlite 进程内模式支持）
- Hono RPC 提供零代码生成的类型安全客户端
- hono-openapi 实现路由自动扫描 → OpenAPI 规范生成
- 轻量（~14KB），性能优异
- 成熟的中间件生态（cors, compress, logger, static 等内置）
- 支持流式响应（SSE, ReadableStream）

**关键包**：

- `hono` — 核心框架
- `@hono/node-server` — Node.js 适配器
- `hono-openapi` — 路由自动扫描 + OpenAPI 规范生成
- `@hono/standard-validator` — Standard Schema 验证器
- `@hono/swagger-ui` — Swagger UI 中间件

### 2.2 Drizzle ORM

**选型理由**：

- 无装饰器，schema-as-code（`pgTable()` 函数定义表结构）
- PGlite 一等支持（官方适配器 `drizzle-orm/pglite`）
- 极致 TypeScript 类型推断（`$inferSelect` / `$inferInsert` 自动派生类型）
- 支持关系查询（`relations()` 函数定义）
- 轻量，无 `reflect-metadata` 依赖
- 支持多数据库实例（双库架构天然支持）
- **Drizzle Kit 提供完整的 schema 版本管理和迁移能力**

**关键包**：

- `drizzle-orm` — 核心 ORM
- `drizzle-kit` — 迁移工具（生成 SQL 迁移文件、schema 推送）

### 2.3 PGlite 连接方式

当前使用 PGlite Worker 线程模式 + `@electric-sql/pglite-socket` 暴露 TCP 端口 + 标准 pg 驱动连接。重构后改用**进程内模式**：

- 直接 `new PGlite('./data/main-db')` 在主进程中运行
- Drizzle 通过 `drizzle-orm/pglite` 驱动直连，无需经过网络层
- 无 Worker 开销、无端口占用、架构更简单
- 后端本身是 Electron 子进程，PGlite 阻塞不影响 UI
- 移除 `@electric-sql/pglite-socket`、`@electric-sql/pglite-tools` 依赖和 Worker 代码
- 如未来拆分为云端服务，云端直接使用标准 PostgreSQL + `drizzle-orm/node-postgres`

### 2.4 Zod（校验 + 类型源）

项目已有 `zod` 依赖，升级为核心类型定义层：

- 请求 body/query/params 校验
- 响应格式定义
- 与 @hono/zod-openapi 集成自动生成 API 文档
- 替代手写的 `src/types/` 接口

### 2.5 consola（统一日志 + 文件持久化）

项目已在 `src/utils/logger.ts` 中使用 consola，但未全局统一。目标：

- 统一替换所有 `console.log/error/warn` 为 `logger.info/error/warn`
- 移除 Winston、Morgan 依赖
- **日志文件持久化**：通过 consola 自定义 reporter 写入文件
  - 日志目录：`{app-data}/logs/`（Electron 环境使用 `app.getPath('userData')`，独立运行使用 `env-paths`）
  - 文件命名：`app-YYYY-MM-DD.log`，按日分割
  - 保留策略：自动清理 30 天前的日志文件
  - 日志级别：文件写入 info 及以上，控制台在开发模式显示 debug

### 2.6 移除 LangGraph Checkpoint PostgreSQL

**分析结论**：`@langchain/langgraph-checkpoint-postgres`（PostgresSaver）在本项目中的唯一实际作用是在 `resumeLearningSession` 场景下通过 `graph.getState(thread_id)` 加载之前的对话上下文。但项目已有完全独立的冗余存储——`AiInteraction` 表记录了每次对话的完整内容，所有面向前端的 API（历史、会话列表、统计）100% 读 AiInteraction 表，从不读 checkpoint。

**替代方案**：

- 移除 `PostgresSaver`，改用模块级 `MemorySaver` 处理进程内的对话连续性
- 恢复会话时，从 `AiInteraction` 表查询历史记录，重建 `[HumanMessage, AIMessage, ...]` 数组注入 LLM
- 这样可以同时移除 `pg`、`pg-pool`、`@langchain/langgraph-checkpoint-postgres` 依赖

**不受影响**：DailyChat（已用 MemorySaver）、AnswerEvaluator（一次性调用）、前端历史展示、会话列表、统计

**一并清理**：`UserSessionMapping` 表（实际未被任何业务代码使用）、`IntegratedPostgreSQLStorage` 中所有 pg.Pool 相关代码

### 2.7 数据库版本管理与自动升级

作为 Electron 客户端的内嵌后端，需要在应用版本更新时自动迁移数据库 schema：

**Drizzle Kit 迁移机制**：

- 开发阶段：`drizzle-kit generate` 根据 schema 变更生成 SQL 迁移文件
- 迁移文件存放在 `drizzle/migrations/` 目录，随应用打包分发
- 应用启动时：通过 `drizzle-orm/migrator` 编程式执行未应用的迁移

**版本管理规范**：

- 每次 schema 变更都生成迁移文件（`drizzle-kit generate`）
- 迁移文件不可修改（一旦发布即不可变）
- 迁移编号使用时间戳排序
- 破坏性变更（删列、改类型）需提供数据转换 SQL
- Drizzle 自动维护 `__drizzle_migrations` 表跟踪已执行的迁移

**从 TypeORM `synchronize: true` 迁移策略**：

1. 用 `drizzle-kit introspect` 从现有数据库反向生成 Drizzle schema 作为基线
2. 基于此基线生成初始迁移文件（空迁移，仅标记基线）
3. 后续所有变更通过标准迁移流程管理

---

## 3. 目标架构

### 3.1 目录结构

```
src/
├── app.ts                      # Hono 应用入口 + 中间件注册
├── routes/                     # 路由定义（替代 controllers/）
│   ├── index.ts                # 路由聚合，导出 AppType
│   ├── courses.ts              # 课程路由
│   ├── users.ts                # 用户路由
│   ├── ai-chat.ts              # AI 聊天路由（含流式）
│   ├── chapters.ts
│   ├── sections.ts
│   ├── exercises.ts
│   ├── exercise-options.ts
│   ├── exercise-results.ts
│   ├── ai-interactions.ts
│   ├── ai-personas.ts
│   ├── course-schedules.ts
│   ├── learning-records.ts
│   ├── titles.ts
│   ├── tests.ts
│   ├── test-results.ts
│   ├── leading-questions.ts
│   ├── system-prompts.ts
│   └── bilibili/               # Bilibili 代理子路由
│       ├── proxy.ts
│       ├── login.ts
│       └── video.ts
├── db/                         # 数据库层（替代 models/ + config/database.ts）
│   ├── index.ts                # 双数据库连接初始化、导出 mainDb / userDb
│   ├── migrate.ts              # 编程式迁移执行（启动时自动升级）
│   ├── main/                   # 主库
│   │   ├── schema.ts           # Drizzle pgTable 定义（课程、章节、练习等）
│   │   └── relations.ts        # 关系定义
│   └── user/                   # 用户库
│       ├── schema.ts           # Drizzle pgTable 定义（用户、记录、会话等）
│       └── relations.ts        # 关系定义
├── schemas/                    # Zod 校验 schema（替代 types/）
│   ├── common.ts               # ApiResponse、分页等通用 schema
│   ├── course.ts               # 课程请求/响应 schema
│   ├── user.ts
│   ├── ai-chat.ts
│   ├── chapter.ts
│   ├── section.ts
│   ├── exercise.ts
│   └── ...                     # 其它业务 schema
├── services/                   # 业务逻辑层（保留并扩展）
│   ├── systemPromptService.ts
│   └── ...                     # 从路由中抽取的业务逻辑
├── llm/                        # LLM 层（结构保留，内部数据库调用适配）
│   ├── agent/
│   ├── domain/
│   ├── prompt/
│   ├── storage/
│   ├── tool/
│   └── utils/
├── middleware/                  # Hono 中间件
│   ├── errorHandler.ts         # 统一错误处理
│   └── llmSettingsError.ts     # LLM 配置错误类
├── utils/
│   ├── logger.ts               # consola 统一日志（含文件 reporter）
│   ├── paths.ts
│   ├── port.ts
│   └── ofetch.ts
├── scripts/
│   ├── initDB.ts
│   └── seedFromAI.ts
└── config/
    └── llm-config.json         # LLM 模型配置
```

### 3.2 路由设计模式

使用 `@hono/zod-openapi` 的 `OpenAPIHono` + `createRoute` 定义类型安全路由：

```typescript
// src/routes/courses.ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { mainDb } from '@/db'
import { courses } from '@/db/main/schema'
import { createCourseSchema, courseResponseSchema } from '@/schemas/course'

const app = new OpenAPIHono()

const searchRoute = createRoute({
  method: 'post',
  path: '/search',
  tags: ['课程'],
  request: {
    body: { content: { 'application/json': { schema: searchCourseSchema } } }
  },
  responses: {
    200: { content: { 'application/json': { schema: apiResponseSchema(courseResponseSchema) } } }
  }
})

app.openapi(searchRoute, async (c) => {
  const body = c.req.valid('json')
  const result = await mainDb.select().from(courses).where(...)
  return c.json({ success: true, data: result })
})

export default app
```

### 3.3 数据库表定义模式

使用 Drizzle `pgTable` 替代 TypeORM `@Entity` 装饰器：

```typescript
// src/db/main/schema.ts
import { pgTable, uuid, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
  course_id: uuid('course_id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  cover_image: varchar('cover_image', { length: 500 }),
  total_hours: integer('total_hours'),
  category: varchar('category', { length: 100 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const chapters = pgTable('chapters', {
  chapter_id: uuid('chapter_id').defaultRandom().primaryKey(),
  course_id: uuid('course_id').references(() => courses.course_id),
  name: varchar('name', { length: 255 }).notNull(),
  chapter_order: integer('chapter_order').notNull(),
});
```

### 3.4 Zod Schema 模式

替代手写的 TypeScript 接口，同时提供校验和类型：

```typescript
// src/schemas/course.ts
import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  cover_image: z.string().url().optional(),
  total_hours: z.number().int().positive().optional(),
  category: z.string().max(100).optional(),
});

export type CreateCourseRequest = z.infer<typeof createCourseSchema>;
```

### 3.5 客户端 RPC 类型导出

```typescript
// src/routes/index.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import courses from './courses';
import users from './users';

const app = new OpenAPIHono().route('/courses', courses).route('/users', users);
// ... 其它路由

export type AppType = typeof app;
export default app;
```

客户端使用（前端项目或测试）：

```typescript
import { hc } from 'hono/client';
import type { AppType } from 'server/src/routes';

const client = hc<AppType>('http://localhost:3000/api');
const res = await client.courses.search.$post({ json: { keyword: 'math' } });
```

### 3.6 统一响应格式

保留现有 `ApiResponse<T>` 模式，用 Zod schema 定义：

```typescript
// src/schemas/common.ts
import { z } from 'zod';

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    details: z.any().optional(),
    pagination: z
      .object({
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
        totalPages: z.number(),
      })
      .optional(),
  });
```

### 3.7 双数据库连接

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import * as mainSchema from './main/schema';
import * as userSchema from './user/schema';

const mainPglite = new PGlite('path/to/main-db');
const userPglite = new PGlite('path/to/user-db');

export const mainDb = drizzle(mainPglite, { schema: mainSchema });
export const userDb = drizzle(userPglite, { schema: userSchema });
```

注：PGlite 采用进程内模式直连（无 Worker 线程），Drizzle 通过 `drizzle-orm/pglite` 驱动直接操作。若部署为云端服务，切换为 `drizzle-orm/node-postgres` + 标准 PostgreSQL 连接。

### 3.8 启动时自动迁移

```typescript
// src/db/migrate.ts
import { migrate } from 'drizzle-orm/pglite/migrator';

export async function runMigrations(db: ReturnType<typeof drizzle>) {
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
}
```

应用启动顺序：创建 PGlite 实例 → 执行迁移 → 初始化 Drizzle → 注册路由 → 启动 HTTP 服务。

---

## 4. 依赖变更清单

### 4.1 移除

| 包名                                       | 类型   | 原因                                  |
| ------------------------------------------ | ------ | ------------------------------------- |
| `express`                                  | 运行时 | 替换为 Hono                           |
| `tsoa`                                     | 运行时 | 替换为 @hono/zod-openapi              |
| `typeorm`                                  | 运行时 | 替换为 Drizzle                        |
| `reflect-metadata`                         | 运行时 | 装饰器元数据，不再需要                |
| `sequelize`                                | 运行时 | 遗留未使用                            |
| `winston`                                  | 运行时 | 已被 consola 替代但未移除             |
| `morgan`                                   | 运行时 | Express 日志中间件                    |
| `helmet`                                   | 运行时 | Express 安全中间件                    |
| `cors`                                     | 运行时 | Hono 内置 cors 中间件                 |
| `swagger-ui-express`                       | 运行时 | 替换为 @hono/swagger-ui               |
| `pg-hstore`                                | 运行时 | Sequelize 专用                        |
| `@electric-sql/pglite-socket`              | 运行时 | 进程内模式不再需要                    |
| `@electric-sql/pglite-tools`               | 运行时 | 进程内模式不再需要                    |
| `@langchain/langgraph-checkpoint-postgres` | 运行时 | 改用 MemorySaver + AiInteraction 重建 |
| `pg`                                       | 运行时 | 仅 checkpoint 使用，不再需要          |
| `pg-pool`                                  | 运行时 | 仅 checkpoint 使用，不再需要          |
| `pgpass`                                   | 运行时 | pg 附属，不再需要                     |
| `@types/pg`                                | 类型   | 不再需要                              |
| `@types/express`                           | 类型   | 不再需要                              |
| `@types/morgan`                            | 类型   | 不再需要                              |
| `@types/helmet`                            | 类型   | 不再需要                              |
| `@types/swagger-ui-express`                | 类型   | 不再需要                              |
| `nodemon`                                  | 开发   | Bun 内置 watch 模式                   |
| `ts-node`                                  | 开发   | Bun 原生支持 TS                       |

### 4.2 新增

| 包名                       | 类型   | 用途                            |
| -------------------------- | ------ | ------------------------------- |
| `hono`                     | 运行时 | Web 框架                        |
| `@hono/node-server`        | 运行时 | Node.js 适配器（PGlite 兼容）   |
| `hono-openapi`             | 运行时 | 路由自动扫描 → OpenAPI 规范生成 |
| `@hono/standard-validator` | 运行时 | Standard Schema 验证器          |
| `@hono/swagger-ui`         | 运行时 | Swagger UI 中间件               |
| `drizzle-orm`              | 运行时 | ORM                             |
| `drizzle-kit`              | 开发   | 数据库迁移/推送工具             |

### 4.3 保留

| 包名                                     | 说明                                   |
| ---------------------------------------- | -------------------------------------- |
| `@electric-sql/pglite`                   | PGlite 嵌入式 PostgreSQL（进程内模式） |
| `@langchain/*`（除 checkpoint-postgres） | LLM 框架，全部升级到 1.x/2.x           |
| `zod`                                    | 升级到 4.x，core 类型定义层            |
| `consola`                                | 统一日志                               |
| `dotenv`                                 | 环境变量                               |
| `ofetch`                                 | HTTP 客户端                            |
| `lodash`                                 | 工具库                                 |
| `vitest`                                 | 测试框架，升级到 4.x                   |
| `tsdown`                                 | Bun 构建                               |

---

## 5. 文件变更清单

### 5.1 删除

| 文件 / 目录                 | 原因                                  |
| --------------------------- | ------------------------------------- |
| `tsoa.json`                 | tsoa 配置                             |
| `src/tsoa.ts`               | tsoa 装饰器重导出                     |
| `nodemon.json`              | 改用 Bun watch                        |
| `build/routes.ts`           | tsoa 生成的路由                       |
| `build/swagger.json`        | tsoa 生成的 OpenAPI（改为运行时生成） |
| `src/controllers/`          | 整个目录，由 `src/routes/` 替代       |
| `src/models/`               | 整个目录，由 `src/db/` 替代           |
| `src/types/`                | 整个目录，由 `src/schemas/` 替代      |
| `src/config/database.ts`    | 由 `src/db/index.ts` 替代             |
| `src/utils/pgLiteWorker.ts` | 进程内模式不再需要 Worker             |

### 5.2 新建

| 文件 / 目录           | 职责                               |
| --------------------- | ---------------------------------- |
| `src/routes/`         | Hono 路由定义（约 20 个文件）      |
| `src/db/`             | Drizzle schema + 连接初始化 + 迁移 |
| `src/schemas/`        | Zod 校验/类型 schema               |
| `drizzle.config.ts`   | Drizzle Kit 配置                   |
| `drizzle/migrations/` | SQL 迁移文件（版本化管理）         |

### 5.3 修改

| 文件                                          | 变更内容                                                      |
| --------------------------------------------- | ------------------------------------------------------------- |
| `src/app.ts`                                  | Express → Hono，中间件替换                                    |
| `tsconfig.json`                               | 移除 experimentalDecorators / emitDecoratorMetadata           |
| `package.json`                                | 依赖增删、scripts 更新                                        |
| `tsdown.config.ts`                            | 更新入口和依赖列表                                            |
| `Dockerfile`                                  | 适配新构建流程                                                |
| `src/utils/logger.ts`                         | 确认 consola 配置，可能微调                                   |
| `src/middleware/errorHandler.ts`              | Express → Hono 错误处理中间件                                 |
| `src/middleware/llmSettingsError.ts`          | 检查是否需要调整                                              |
| `src/services/systemPromptService.ts`         | TypeORM → Drizzle 查询                                        |
| `src/llm/storage/*.ts`                        | TypeORM DataSource → Drizzle 查询                             |
| `src/llm/domain/learning_assistant.ts`        | TypeORM 实体/Repository → Drizzle 查询                        |
| `src/llm/domain/learning_review_evaluator.ts` | TypeORM → Drizzle                                             |
| `src/llm/prompt/manager.ts`                   | 间接受 service 层变更影响                                     |
| `src/llm/agent/single_chat.ts`                | 移除未使用的 express 导入                                     |
| `src/llm/agent/react_agent_base.ts`           | 移除 PostgresSaver，改用 MemorySaver + AiInteraction 历史重建 |
| `src/scripts/initDB.ts`                       | 适配 Drizzle                                                  |
| `src/scripts/seedFromAI.ts`                   | 适配 Drizzle                                                  |

---

## 6. LLM 层影响分析

LLM 层中需要修改的文件共 6 个：

| 文件                                      | 依赖程度 | 变更内容                                                 |
| ----------------------------------------- | -------- | -------------------------------------------------------- |
| `llm/domain/learning_assistant.ts`        | 最重     | TypeORM→Drizzle（9 个实体）+ 移除 checkpoint 依赖        |
| `llm/domain/learning_review_evaluator.ts` | 重       | TypeORM→Drizzle（4 个实体）                              |
| `llm/storage/integrated_storage.ts`       | 重       | 移除 pg.Pool + PostgresSaver，改用 MemorySaver + Drizzle |
| `llm/storage/persistent_storage.ts`       | 重       | TypeORM→Drizzle（2 个实体），可能简化或合并              |
| `llm/agent/react_agent_base.ts`           | 中       | 移除 PostgresSaver 相关逻辑，从 AiInteraction 重建历史   |
| `llm/prompt/manager.ts`                   | 间接     | 随 service 层变更适配                                    |

**迁移策略**：

- TypeORM Repository → Drizzle query（API 风格类似，`select().from().where()`）
- PostgresSaver → 模块级 MemorySaver + AiInteraction 历史重建
- pg.Pool 连接代码全部移除

**不受影响的 LLM 文件**：`answer_evaluator.ts`、`daily_chat.ts`、`single_chat.ts`（仅删除一行无用导入）、`create_llm.ts`、`modelConfigManager.ts`、`tool/` 目录全部文件、`prompt/default.ts`、`prompt/const.ts`。

---

## 7. 迁移阶段规划

### Phase 1：基础设施（框架 + 日志）✅

**目标**：替换 Web 框架、统一日志

**任务清单**：

- [x] 安装新依赖（hono, @hono/node-server, hono-openapi, @hono/standard-validator, @hono/swagger-ui）
- [x] 移除 Express 相关依赖（express, helmet, cors, morgan, swagger-ui-express 及 @types）
- [x] 重写 `src/app.ts` — Express → Hono
- [x] 重写 `src/middleware/errorHandler.ts` — Express → Hono 错误处理
- [x] 增强 `src/utils/logger.ts` — 添加文件 reporter（按日分割 + 自动清理）
- [x] 统一所有 `console.log/error/warn` → consola logger
- [x] 移除 Winston、Morgan 依赖
- [x] 更新 `package.json` scripts（移除 tsoa 相关，调整 dev/build 命令为 Bun 优先）
- [x] 移除 `tsoa.json`、`src/tsoa.ts`、`nodemon.json`
- [x] 验证 Bun 开发模式正常运行

### Phase 2：ORM 迁移 + Checkpoint 重构 + 数据库版本管理 ✅

**目标**：TypeORM → Drizzle，PGlite 改为进程内模式，移除 PostgresSaver，建立 schema 版本管理

**任务清单**：

- [x] 安装 drizzle-orm、drizzle-kit
- [x] 创建 `src/db/main/schema.ts` — 迁移 10 个主库实体表定义
- [x] 创建 `src/db/main/relations.ts` — 定义主库关系
- [x] 创建 `src/db/user/schema.ts` — 迁移 11 个用户库实体表定义
- [x] 创建 `src/db/user/relations.ts` — 定义用户库关系
- [x] 创建 `src/db/index.ts` — 双 PGlite 进程内模式初始化
- [x] 创建 `src/db/migrate.ts` — 编程式迁移执行
- [x] 创建 `drizzle.config.ts`
- [x] 用 `drizzle-kit introspect` 生成基线 schema，创建初始迁移
- [x] 重构 LLM checkpoint — 移除 PostgresSaver，改用模块级 MemorySaver
- [x] 重构 `resumeLearningSession` — 从 AiInteraction 表重建对话历史
- [x] 迁移 `src/services/systemPromptService.ts` 的数据库操作
- [x] 迁移 LLM storage 层（简化 integrated_storage，移除 pg.Pool）
- [x] 迁移 LLM domain 层（learning_assistant, learning_review_evaluator）
- [x] 迁移 `src/scripts/initDB.ts` 和 `seedFromAI.ts`
- [x] 移除 TypeORM、reflect-metadata、sequelize、pglite-socket、pglite-tools 依赖
- [x] 移除 pg、pg-pool、pgpass、@langchain/langgraph-checkpoint-postgres 依赖
- [x] 删除 `src/models/`、`src/config/database.ts`、`src/utils/pgLiteWorker.ts`
- [x] 清理 `UserSessionMapping` 模型（未被业务使用）
- [x] 更新 `tsconfig.json` — 移除装饰器选项
- [x] 验证双库连接、自动迁移、数据操作正常

### Phase 3：路由 + Schema 迁移 ✅

**目标**：tsoa Controller → Hono 路由 + Zod schema

**任务清单**：

- [x] 创建 `src/schemas/common.ts` — 通用响应/分页 schema
- [x] 逐个创建 `src/schemas/*.ts` — 各业务 Zod schema（17 个文件）
- [x] 创建 CRUD 路由工厂 `src/routes/_crud.ts`
- [x] 逐个创建 `src/routes/*.ts` — 迁移 20 个 Controller 为 Hono 路由（19 个路由文件）
- [x] 创建 `src/routes/index.ts` — 路由聚合
- [x] 创建 `src/db/syncSchema.ts` — 启动时 CREATE TABLE IF NOT EXISTS
- [x] 接入 hono-openapi + @hono/swagger-ui 到 `/docs` 路由（Phase 4 完成）
- [x] 删除 `src/controllers/` 目录
- [x] 删除 `src/types/` 目录
- [ ] 验证所有 ~105 个端点功能正常
- [x] 类型检查通过（新代码零错误）

**备注**：

- 使用 plain Hono 路由 + 手动 zod `.parse()` 而非 OpenAPIHono/createRoute（因 95 个端点量大，简化实现优先）
- CRUD 工厂自动生成 5 个标准端点（search, getById, add, update, delete），12 个路由文件使用
- OpenAPI 文档使用 `hono-openapi` + `includeEmptyPaths: true` 自动扫描路由树生成，已在 Phase 4 完成
- 后续可逐个路由添加 `describeRoute` + `validator` 中间件增强文档详情

### Phase 4：收尾优化 ✅

**目标**：构建优化、运行验证、文档更新

**任务清单**：

- [x] 运行 `bun dev` 验证服务器启动正常
- [ ] 端到端测试关键 API 端点
- [x] 修复 `react_agent_base.ts` 的 6 个 LangGraph 类型错误（pre-existing）
- [x] 修复 `read_srt.ts` 的 12 个 undefined 检查错误（pre-existing）
- [x] 确认 Hono RPC 客户端类型导出可用
- [x] 更新 `tsdown.config.ts` 适配新依赖（移除 pgLiteWorker 入口）
- [x] 更新 `Dockerfile` 构建流程（Bun 构建 + PGlite 内嵌，移除 PostgreSQL）
- [x] 按需接入 OpenAPI 文档生成和 Swagger UI（hono-openapi 自动扫描 + @hono/swagger-ui）
- [x] 清理遗留代码和无用文件（删除 `src/llm/debug/` 演示目录）
- [x] 通过 `bun tsc --noEmit` 全量类型检查零错误
- [x] 更新 `package.json` 脚本（npm run → bun run）

---

## 8. 风险与注意事项

### 8.1 PGlite 进程内模式

采用进程内模式（`new PGlite('./data/...')`）直连。需注意：

- PGlite 进程内模式在 Bun 下的兼容性验证
- 双库需两个独立的 PGlite 实例，各自指向不同数据目录
- 查询会阻塞当前进程，但后端为 Electron 子进程，不影响 UI

### 8.2 流式响应

当前 AI 聊天使用 Node.js `Readable` stream 返回流式 LLM 响应。Hono 中：

- 可使用 `c.stream()` 或 `c.streamText()` 返回 `ReadableStream`
- 可能需要将 Node.js `Readable` 转换为 Web `ReadableStream`
- SSE 模式可使用 `hono/streaming` 的 `streamSSE` 辅助函数

### 8.3 LangGraph Checkpoint 移除

移除 PostgresSaver 后需改造 `IntegratedPostgreSQLStorage` 和 `ReactAgent` 的 checkpoint 相关逻辑：

- 改用模块级 `MemorySaver`（同 DailyChat 的做法）
- 在 `resumeLearningSession` 中从 `AiInteraction` 表查询历史，重建 `[HumanMessage, AIMessage]` 数组
- 移除 `pg.Pool` 创建、`PostgresSaver.setup()` 等代码
- 清理 `UserSessionMapping` 模型和 `ConversationAnalytics` 中的 checkpoint 相关统计

### 8.4 数据迁移兼容性

- 用 `drizzle-kit introspect` 从现有数据库生成基线 schema，确保与现有数据 100% 兼容
- 表名和列名保持不变
- 首次迁移为空迁移（仅标记基线），不做任何 ALTER
- 客户端版本更新时，`migrate()` 自动执行增量迁移

### 8.5 路由迁移工作量

~105 个端点中，绝大多数是标准 CRUD 操作（search, getById, add, update, delete），模式高度统一。可考虑：

- 创建通用 CRUD 路由工厂函数，减少重复代码
- 批量生成标准 CRUD 路由，仅对特殊路由（如 ai-chat 流式）手工编写

---

## 9. 未来架构演进

### 9.1 本地 + 云端拆分

当业务需要支持移动端时，架构可拆分为：

```
┌─────────────────────────┐    ┌──────────────────────────┐
│   本地后端 (Electron)     │    │   云端公共服务器           │
│                         │    │                          │
│  UserDB (PGlite 本地)   │←──→│  MainDB (PostgreSQL)      │
│  - 用户学习记录          │    │  - 课程/章节/练习内容      │
│  - 会话/进度数据         │    │  - AI 人设/系统提示词      │
│  - AI 对话历史           │    │  - 公共资源数据            │
│                         │    │                          │
│  LLM 调用 + 流式响应     │    │  API (Hono + Drizzle)     │
│  MemorySaver (进程内)    │    │  + node-postgres 驱动     │
└─────────────────────────┘    └──────────────────────────┘
```

**拆分要点**：

- 路由层可复用，仅需调整数据源（mainDb 指向远程 / userDb 保持本地）
- Drizzle schema 天然支持切换驱动（`pglite` → `node-postgres`）
- Hono RPC 客户端类型可在本地后端和移动端之间共享

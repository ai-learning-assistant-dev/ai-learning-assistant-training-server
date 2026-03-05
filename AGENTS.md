# AI Learning Assistant Training Server 开发规范

## 1. 项目概述

AI Learning Assistant Training Server 是一个面向教育场景的 AI 辅助学习平台后端服务，支持课程管理、AI 聊天对话（流式/非流式）、答案评估、学习进度跟踪、学习总结生成等功能。

### 1.1 技术栈

| 技术                  | 用途                                    |
| --------------------- | --------------------------------------- |
| Bun                   | 主运行时（Bun 优先，保留 Node.js 兼容） |
| TypeScript (ESNext)   | 主要开发语言，strict mode，无装饰器     |
| Hono 4.x              | Web 框架                                |
| Drizzle ORM 0.45      | ORM（schema-as-code，无装饰器）         |
| PGlite                | 嵌入式 PostgreSQL（进程内模式直连）     |
| Zod 4.x               | 请求校验 + 类型定义                     |
| LangChain + LangGraph | LLM 框架（多 Provider 支持）            |
| Vitest                | 测试框架                                |
| consola               | 统一日志（控制台 + 文件持久化）         |
| Docker                | 部署（多阶段构建）                      |

### 1.2 架构概要

项目采用分层路由架构 + 领域驱动的 LLM 集成层：

```
Route (Hono 路由) → Drizzle ORM → PGlite (进程内)
       ↘
        LLM Domain Layer (Agent → Storage → Prompt)
```

- **Routes**（`src/routes/`）：Hono 路由定义，Zod schema 校验请求
- **DB**（`src/db/`）：Drizzle pgTable 定义表结构 + 关系
- **Schemas**（`src/schemas/`）：Zod 校验 schema + TypeScript 类型
- **Services**（`src/services/`）：业务逻辑封装
- **LLM Domain**（`src/llm/domain/`）：学习助手、每日聊天、答案评估等 AI 业务对象
- **LLM Agent**（`src/llm/agent/`）：基于 LangGraph 的 ReactAgent 封装和 SingleChat 轻量包装

**双数据库架构**（PGlite 嵌入式 PostgreSQL，进程内模式）：

- `mainDb`：内容数据（课程、章节、小节、练习、AI 人设、系统提示词）
- `userDb`：用户数据（用户、学习记录、会话映射、进度、每日总结）

### 1.3 目录结构

| 目录               | 职责                                                            |
| ------------------ | --------------------------------------------------------------- |
| `src/app.ts`       | 入口文件，Hono 配置、中间件注册、Bun.serve() 启动               |
| `src/routes/`      | Hono 路由定义（约 20 个路由文件 + CRUD 工厂）                   |
| `src/db/`          | Drizzle schema + 关系 + 数据库初始化 + 迁移                     |
| `src/schemas/`     | Zod 校验 schema + TypeScript 类型定义                           |
| `src/services/`    | 业务服务层                                                      |
| `src/config/`      | LLM JSON 配置                                                   |
| `src/middleware/`  | 错误处理中间件                                                  |
| `src/llm/agent/`   | LangGraph ReactAgent 封装与 SingleChat                          |
| `src/llm/domain/`  | AI 业务对象（LearningAssistant、DailyChat、AnswerEvaluator 等） |
| `src/llm/prompt/`  | 提示词管理（默认模板 + DB 覆盖 + 变量替换）                     |
| `src/llm/storage/` | 持久化存储（Drizzle 查询会话映射、对话分析）                    |
| `src/llm/utils/`   | LLM 创建工厂（多 Provider 支持）、模型配置管理器                |
| `src/llm/tool/`    | LangChain 工具（SRT 字幕读取等）                                |
| `src/utils/`       | 日志（consola）、路径、HTTP 客户端                              |
| `src/scripts/`     | 数据库初始化与种子数据脚本                                      |
| `test/`            | Vitest 测试文件                                                 |

### 1.4 LLM Agent 架构

```
ReactAgent (LangGraph createReactAgent 封装)
├── SingleChat (轻量一次性对话，可选内存)
│     └── DailyChat (固定人设的每日对话)
└── LearningAssistant (完整学习助手，含持久化存储、SRT 工具)
```

多模型支持（通过 `src/llm/utils/create_llm.ts` 工厂方法）：
OpenAI、Azure OpenAI、Anthropic、Google Gemini、Ollama、DeepSeek、豆包

---

## 2. 构建和运行命令

### 2.1 日常开发

```bash
# 开发模式（Bun watch 热重载）
bun dev

# 或
bun --watch src/app.ts

# 生产构建
bun build
```

### 2.2 类型检查

```bash
bun typecheck
# 或
bun tsc --noEmit
```

### 2.3 数据库命令

```bash
# 生成主库迁移
bun db:generate:main

# 生成用户库迁移
bun db:generate:user

# Drizzle Studio（主库/用户库）
bun db:studio:main
bun db:studio:user
```

### 2.4 其它命令

```bash
bun db:init        # 初始化数据库
bun db:seed        # AI 生成种子数据
bun clean          # 清理构建产物
```

### 2.5 验证原则

- **日常开发**用 `bun dev`，支持热重载
- **验证类型**可运行 `bun tsc --noEmit` 快速检查
- **非必要不使用** `bun build`

---

## 3. 文档体系

| 文档                | 用途                  | 维护规则                               |
| ------------------- | --------------------- | -------------------------------------- |
| `AGENTS.md`         | AI 开发规范（本文档） | 项目级不变规范，仅在架构重大变更时更新 |
| `docs/MIGRATION.md` | 重构迁移文档          | 记录重构方案、规划、规范、任务及进度   |

### 3.1 文档规范

- **代码文件中不写规划**，按需求直接实现代码
- **暂不产生额外文档**，暂不处理 README

---

## 4. AI 工作流程

### 4.1 接受任务时

1. **理解任务**：明确任务范围和目标，需要收集汇总相关信息时，尽量使用 subagent
2. **制定计划**：在 todo list 中列出具体步骤
3. **逐步执行**：按 todo list 逐项完成，每完成一项立即标记
4. **可靠依赖**：对于非直接业务的需求，尽量使用成熟的开源依赖
5. **工具调用**：尽量使用工具调用来查询、读取项目内的文件

### 4.2 编写代码时

1. **保持一致性**：遵循项目现有的代码风格和命名规范
2. **按需修改**：少量修改时使用工具调用修改现有文件，大量修改时先删除，再新建重写整个文件，不要通过终端命令修改
3. **类型验证**：修改完成后用 `bun tsc --noEmit` 验证类型检查通过

### 4.3 任务完成时

1. 确认所有修改类型检查通过（`bun tsc --noEmit`）
2. 向终端发送内容为空的 `echo` 命令确认下一步
3. 记住：**现有任务结束前向终端发送内容为空的 `echo` 命令确认下一步！！！!!!!**

### 4.4 其它情况

1. 如果命令中提出新方案，先对方案做分析，不立即修改，分析完成后向终端发送内容为空的 `echo` 命令确认是否执行
2. 如果在尝试运行编译测试命令时，得到的是新指令，那么默认视为编译运行通过
3. 如果需要在阅读大量文件后汇总信息，或者进行局部较低难度的处理，那尽量使用 subagent 处理

---

## 5. 核心规范

### 5.1 TypeScript 代码规范

- **模块系统**：ESM（`"type": "module"`），`module: "esnext"`, `moduleResolution: "bundler"`
- **路径别名**：`@/*` → `src/*`，`@db/*`、`@routes/*`、`@schemas/*`、`@middleware/*`、`@utils/*`、`@llm/*`
- **错误处理**：路由层统一 try/catch，通过 `ok()` / `fail()` 辅助函数返回统一格式
- **统一响应格式**：`ApiResponse<T>` = `{ success, data?, message?, error?, details?, pagination? }`
- **异步**：全面 async/await，流式响应使用 Hono `streamText` + Node.js `Readable`
- **无装饰器**：所有定义均使用函数式 API

### 5.2 命名规范

- **文件名**：camelCase（`courses.ts`、`aiChat.ts`）
- **类名**：PascalCase（`LearningAssistant`、`AnswerEvaluator`）
- **数据库列名**：snake_case（`user_id`、`section_order`）
- **Zod schema 名**：camelCase + Schema 后缀（`createCourseSchema`、`chatRequestSchema`）

### 5.3 API 设计

- **Hono 驱动**：路由使用 Hono 创建，Zod 手动 `.parse()` 校验请求体
- **基础路径**：`/api`
- **统一响应**：通过 `ok(data, message?)` / `fail(error, details?)` / `paginate(data, pagination)` 辅助函数
- **CRUD 工厂**：`src/routes/_crud.ts` 提供 `createCrudRoutes()` 自动生成 5 个标准端点（search, getById, add, update, delete）
- **流式响应**：使用 `streamText` from `hono/streaming`，通过 `pipeReadable()` 辅助函数将 Node.js Readable 转为 Hono 流

#### 添加新 API 步骤

1. 在 `src/schemas/` 中定义 Zod 请求校验 schema
2. 在 `src/db/` 中定义 Drizzle pgTable（如需新表）+ 在 `syncSchema.ts` 中添加 CREATE TABLE
3. 在 `src/routes/` 中创建路由文件（标准 CRUD 使用 `createCrudRoutes()` 工厂）
4. 在 `src/routes/index.ts` 中注册路由
5. 完成！

### 5.4 数据库规范

- **Drizzle ORM 0.45**，`pgTable()` 函数定义表结构，`relations()` 定义关系
- **PGlite** 嵌入式 PostgreSQL，进程内模式直连，无需外部服务
- **双库分离**：Main DB（内容数据）+ User DB（用户数据）
- **UUID 主键**：`uuid().defaultRandom().primaryKey()`
- **Schema 同步**：启动时通过 `syncSchema.ts` 执行 `CREATE TABLE IF NOT EXISTS`
- Docker 部署时切换为标准 PostgreSQL + `drizzle-orm/node-postgres`

### 5.5 LLM 集成规范

- **工厂方法**：`create_llm.ts` 统一创建 LLM 实例，支持 7 种 Provider
- **配置管理**：`ModelConfigManager` 单例从 `src/config/llm-config.json` 加载模型配置
- **提示词管理**：默认模板在 `src/llm/prompt/default.ts`，可通过 DB `SystemPrompt` 表覆盖，支持 `${variable}` 模板变量替换
- **流式响应**：路由使用 Hono `streamText`，LLM 输出通过 `pipeReadable()` 逐 chunk 推送
- **Checkpoint**：使用 MemorySaver（进程内），恢复会话时从 AiInteraction 表重建对话历史

### 5.6 文件组织

- 新 API 路由放在 `src/routes/`
- 新的 Drizzle 表定义放在 `src/db/main/schema.ts` 或 `src/db/user/schema.ts`
- 新的 Zod schema 放在 `src/schemas/`
- 新的 LLM 业务对象放在 `src/llm/domain/`
- 新的 LangChain 工具放在 `src/llm/tool/`
- 新的提示词模板放在 `src/llm/prompt/`

### 5.7 依赖管理

- 所有依赖版本在根 `package.json` 中管理
- 使用 `bun` 安装依赖
- 优先使用 LangChain 生态中的包进行 LLM 集成

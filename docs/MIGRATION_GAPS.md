# 迁移补齐清单

> 基于 `src-old` 与 `src` 的对比结果，仅列出**需要补齐**的部分。  
> 已适配新架构（Drizzle/Hono）的变更、不再需要的旧内容（如跨库关系注释、TypeORM装饰器等）不在此列。  
> **状态：全部已完成 ✅**

---

## 一、功能性差异（需修复）

### 1.1 `updated_at` 不会自动更新

**影响表**：`system_prompts`、`conversation_analytics`、`user_session_mapping`

- 旧代码：`@UpdateDateColumn` 在每次 `.save()` 时自动更新
- 新代码：`timestamp().defaultNow()` 仅在插入时设默认值，更新时不变

**修复方式**：在 Drizzle 的 update 操作中手动设置 `updated_at: new Date()`，或使用 `.$onUpdate(() => new Date())`

### 1.2 B站登录/短信接口缺少浏览器指纹头

**影响路由**：`POST /proxy/bilibili/sms`、`POST /proxy/bilibili/login`

- 旧代码携带完整浏览器指纹头：`sec-ch-ua`、`sec-ch-ua-mobile`、`sec-ch-ua-platform`、`sec-fetch-dest`、`sec-fetch-mode`、`sec-fetch-site` 等
- 新代码仅保留 `content-type`、`origin`、`referer`、`user-agent`

**风险**：可能导致 B 站接口请求被拒绝

### 1.3 `/chat` 和 `/evaluate` 允许空字符串

- 旧代码：显式判断 `if (!message)` / `if (!studentAnswer)` 拒绝空串
- 新代码：Zod `z.string()` 允许空字符串通过

**修复方式**：在 Zod schema 中使用 `z.string().min(1)` 或在路由中保留手动检查

### 1.4 用户创建缺少唯一约束冲突的友好提示

- 旧代码：捕获 `SequelizeUniqueConstraintError` 返回 "用户名已存在"
- 新代码：唯一约束冲突返回通用数据库错误

---

## 二、注释补齐

### 2.1 路由方法 JSDoc（约 50+ 处）

所有路由文件缺少方法级 JSDoc，需参考旧代码控制器补齐。重点文件：

| 路由文件             | 需补齐的 JSDoc 数量 | 备注                                           |
| -------------------- | ------------------- | ---------------------------------------------- |
| `aiChat.ts`          | 12 个方法           | 最重要，包含流式对话、LLM评估等核心接口说明    |
| `users.ts`           | 7 个方法            | 含 `courseChaptersSectionsByUser` 瀑布解锁逻辑 |
| `systemPrompts.ts`   | 4 个方法            |                                                |
| `exerciseResults.ts` | 3 个方法            | 含简答题查重逻辑                               |
| `tests.ts`           | 2 个方法            |                                                |
| `courses.ts`         | 1 个方法            | `getCourseChaptersSections`                    |
| `exercises.ts`       | 1 个方法            | `getExercisesWithOptionsBySection`             |
| `bilibili.ts`        | 5+ 个工具函数       | WBI 签名、MPD 生成等                           |

### 2.2 数据库 Schema 注释

| 位置                    | 需补齐内容                                   |
| ----------------------- | -------------------------------------------- |
| `sections.srt_path`     | 添加 `// @deprecated 该字段已废弃` 标记      |
| `exercises.type_status` | 保留现有 JS 注释即可（DB 级 comment 非必要） |

---

## 三、低优先级（可选）

| 项目                          | 描述                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `courseSchedule` 响应字段过滤 | CRUD 工厂返回全部列，旧代码只返回特定字段                                                   |
| CRUD 工厂字段校验             | 依赖 Zod schema 覆盖，需逐一验证各 `createXxxSchema` 的必填字段                             |
| 响应类型独立定义              | `ChatStreamlyResponse`、`SessionDetail` 等旧类型已由内联对象替代，如需 OpenAPI 文档则需补充 |

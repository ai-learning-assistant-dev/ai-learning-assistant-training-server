# AI Learning Assistant API 文档

> 基础路径：`/api` · 交互式文档：`GET /docs`

## 前端类型集成

服务端通过 `src/routes/index.ts` 导出 Hono RPC 类型 `ApiType`，前端可借助 `hono/client` 获得完整的路由路径补全与类型推断。

### 安装

```bash
# 前端项目中安装 hono（仅使用类型，不引入运行时）
bun add hono
```

### 使用方式

```ts
import { hc } from 'hono/client';
// 通过相对路径或 monorepo workspace 引用服务端类型
import type { ApiType } from 'ai-learning-assistant-training-server/src/routes';

const client = hc<ApiType>('http://localhost:3000/api');

// 路径自动补全 + 类型推断
const res = await client.courses.search.$post({ json: { page: 1, limit: 20 } });
const data = await res.json();
```

### 配置说明

前端 `tsconfig.json` 需确保能解析服务端源码路径：

```jsonc
{
  "compilerOptions": {
    "paths": {
      // Monorepo：通过 workspace 引用
      "ai-learning-assistant-training-server/*": ["../server/*"],
    },
  },
}
```

若非 monorepo，可使用 `npm link` 或直接复制 `src/routes/index.ts` 中的类型定义至前端项目。

---

## 通用约定

### 响应格式

```jsonc
// 成功
{ "success": true, "data": T, "message": "..." }
// 成功（分页）
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }
// 失败
{ "success": false, "error": "错误描述", "details": "可选详情" }
```

### CRUD 通用端点

以下 13 个实体使用 CRUD 工厂自动生成 5 个标准 POST 端点：

| 端点                | 请求体                              |
| ------------------- | ----------------------------------- |
| `/{entity}/search`  | `{ page?: number, limit?: number }` |
| `/{entity}/getById` | `{ [idField]: uuid }`               |
| `/{entity}/add`     | 各实体 createSchema                 |
| `/{entity}/update`  | 各实体 updateSchema（含主键）       |
| `/{entity}/delete`  | `{ [idField]: uuid }`               |

---

## 一、课程管理

### 课程 `/courses`

CRUD · idField: `course_id`

```
createCourseSchema:
  name: string          # 必填
  icon_url?: string
  description?: string
  default_ai_persona_id?: uuid
```

| 方法 | 路径                                 | 说明                      |
| ---- | ------------------------------------ | ------------------------- |
| POST | `/courses/getCourseChaptersSections` | 课程章节树 + 用户解锁状态 |
| POST | `/courses/import`                    | 整体导入课程（事务）      |

**`/courses/getCourseChaptersSections`**

请求：`{ course_id, user_id }`
响应：课程信息 + `chapters[].sections[]`，每个 section 含 `unlocked`(0/1/2)、`has_exercise`

**`/courses/import`** — 整体导入课程（含章节、小节、练习、选项、引导问题）

整个导入在一个数据库事务中执行，任一步骤失败自动回滚。

请求体：

```jsonc
{
  "id": "uuid", // 必填，课程源 ID
  "title": "string", // 必填，课程名称
  "description": "string", // 可选，默认 ''
  "icon_url": "string", // 可选，默认 ''
  "category": "string", // 可选，默认 '职业技能'
  "contributors": "string", // 可选，默认 '志愿者'
  "chapters": [
    // 可选，默认 []
    {
      "id": "uuid",
      "title": "string",
      "order": 1,
      "sections": [
        {
          "id": "uuid",
          "title": "string",
          "order": 1,
          "video_url": "",
          "knowledge_content": "",
          "estimated_time": 0,
          "knowledge_points": {},
          "video_subtitles": [],
          "exercises": [{ "id": "uuid", "question": "string", "type": "string", "score": 10, "options": [{ "id": "uuid", "text": "string", "is_correct": false }] }],
          "leading_questions": [{ "id": "uuid", "question": "string" }],
        },
      ],
    },
  ],
}
```

命令行导入示例：

```bash
# 通过 API 接口（curl）
curl -X POST http://localhost:3000/api/courses/import \
  -H "Content-Type: application/json" \
  -d @course-data.json

# 通过 CLI 脚本（推荐，自动校验 + 日志 + 批量支持）
bun db:import:course course-data.json

# 指定服务地址
bun db:import:course course-data.json --base-url=http://your-server:3000
```

CLI 脚本 (`bun db:import:course`) 支持：

- 单个课程对象或课程数组批量导入
- Zod schema 本地预校验，导入前发现格式问题
- 彩色日志输出导入进度和结果统计

成功响应（201）：`{ "success": true, "data": { "course_id": "uuid", "name": "课程名" }, "message": "课程导入成功" }`

**`/courses/delete`** — 删除课程（级联删除所有关联数据）

删除课程时自动清理所有关联的章节、小节、练习、练习选项、引导问题。

```bash
curl -X POST http://localhost:3000/api/courses/delete \
  -H "Content-Type: application/json" \
  -d '{"course_id":"uuid"}'
```

### 章节 `/chapters`

CRUD · idField: `chapter_id`

```
createChapterSchema:
  course_id: uuid        # 必填
  title: string          # 必填
  chapter_order: int     # 必填
```

### 小节 `/sections`

CRUD · idField: `section_id`

```
createSectionSchema:
  title: string          # 必填
  chapter_id: uuid       # 必填
  section_order: int     # 必填
  video_url?: string
  knowledge_points?: any
  video_subtitles?: any
  knowledge_content?: string
  estimated_time?: int
```

### 引导问题 `/leading-questions`

CRUD · idField: `question_id`

```
createLeadingQuestionSchema:
  section_id: uuid       # 必填
  question: string       # 必填
```

| 方法 | 路径                                 | 说明                       |
| ---- | ------------------------------------ | -------------------------- |
| POST | `/leading-questions/searchBySection` | 按 section_id 查询（分页） |

---

## 二、练习与测试

### 练习题 `/exercises`

CRUD · idField: `exercise_id`

```
createExerciseSchema:
  section_id?: uuid
  question: string       # 必填
  type_status: string    # 必填 ("0"=单选, "1"=多选, "2"=简答)
  score?: int
  answer: string         # 必填
```

| 方法 | 路径                                          | 说明                   |
| ---- | --------------------------------------------- | ---------------------- |
| POST | `/exercises/getExercisesWithOptionsBySection` | 按小节查询练习题含选项 |

请求：`{ section_id }`

### 练习选项 `/exercise-options`

CRUD · idField: `option_id`

```
createExerciseOptionSchema:
  exercise_id: uuid      # 必填
  option_text: string    # 必填
  is_correct: boolean    # 必填
```

### 答题结果 `/exercise-results`

CRUD · idField: `result_id`

```
createExerciseResultSchema:
  user_id: uuid          # 必填
  exercise_id: uuid      # 必填
  test_result_id?: uuid
  user_answer?: string
  score?: int
  ai_feedback?: string
```

| 方法 | 路径                                    | 说明                                                              |
| ---- | --------------------------------------- | ----------------------------------------------------------------- |
| POST | `/exercise-results/saveExerciseResults` | 批量提交答题，选择题本地判分，简答题 LLM 评分，通过后解锁下一小节 |
| POST | `/exercise-results/getExerciseResults`  | 查询用户在某小节的答题结果                                        |

**saveExerciseResults 请求**：

```jsonc
{
  "user_id": "uuid",
  "section_id": "uuid",
  "test_result_id?": "uuid",
  "list": [{ "exercise_id": "uuid", "user_answer": "..." }],
  "duration?": 120,
}
```

响应：`{ results, score, user_score, pass }`

**getExerciseResults 请求**：`{ user_id, section_id, test_result_id? }`

### 测试 `/tests`

CRUD · idField: `test_id`

```
createTestSchema:
  course_id?: uuid
  type_status: string    # 必填
  title: string          # 必填
```

| 方法 | 路径                                   | 说明                         |
| ---- | -------------------------------------- | ---------------------------- |
| POST | `/tests/getTestsWithExercisesByCourse` | 按课程查询测试含练习题与选项 |
| POST | `/tests/saveTestResults`               | 批量提交测试答题，自动判分   |

**saveTestResults 请求**：

```jsonc
{
  "user_id": "uuid",
  "test_id": "uuid",
  "start_date": "string",
  "end_date?": "string",
  "list": [{ "exercise_id": "uuid", "user_answer": "..." }],
}
```

响应：`{ test_result_id, results, total_score, user_score, pass, pass_rate }`

### 测试结果 `/test-results`

CRUD · idField: `result_id`

```
createTestResultSchema:
  user_id: uuid          # 必填
  test_id: uuid          # 必填
  start_date: string     # 必填
  end_date?: string
  score?: int
  ai_feedback?: string
```

---

## 三、用户与学习

### 用户 `/users`

| 方法 | 路径                                  | 说明                                 |
| ---- | ------------------------------------- | ------------------------------------ |
| GET  | `/users/firstUser`                    | 获取第一个用户                       |
| GET  | `/users/allCourses`                   | 全部课程列表                         |
| POST | `/users/search`                       | 搜索用户 `{ page?, limit?, name? }`  |
| POST | `/users/getById`                      | 查询用户 `{ user_id }`               |
| POST | `/users/add`                          | 创建用户（用户名唯一，冲突返回 409） |
| POST | `/users/update`                       | 更新用户                             |
| POST | `/users/delete`                       | 删除用户 `{ user_id }`               |
| POST | `/users/courseChaptersSectionsByUser` | 查询在学课程及进度 `{ user_id }`     |
| POST | `/users/testJoinById`                 | 查询用户关联的每日总结 `{ user_id }` |

```
createUserSchema:
  name: string           # 必填，唯一
  avatar_url?: string
  education_level?: string
  learning_ability?: string
  goal?: string
  level?: int
  experience?: int
  current_title_id?: uuid
```

### 学习记录 `/learning-records`

CRUD · idField: `task_id`

```
createLearningRecordSchema:
  plan_id: uuid          # 必填
  user_id: uuid          # 必填
  section_id: uuid       # 必填
  start_date?: string
  end_date?: string
  status?: string
```

### 课程安排 `/course-schedules`

CRUD · idField: `plan_id`

```
createCourseScheduleSchema:
  user_id: uuid          # 必填
  course_id: uuid        # 必填
  start_date?: string
  end_date?: string
  status?: string
```

### 称号 `/titles`

CRUD · idField: `title_id`

```
createTitleSchema:
  course_id: uuid        # 必填
  name: string           # 必填
```

### 每日总结 `/daily-summaries`

CRUD · idField: `summary_id`

```
createDailySummarySchema:
  user_id: uuid          # 必填
  summary_date: string   # 必填
  content: string        # 必填
```

---

## 四、AI 聊天

### 对话

| 方法 | 路径                   | 说明                           |
| ---- | ---------------------- | ------------------------------ |
| POST | `/ai-chat/chat`        | 非流式对话                     |
| POST | `/ai-chat/chat/stream` | 流式对话（兼容 daily 模式）    |
| POST | `/ai-chat/daily`       | Daily 轻量流式对话（固定人设） |

**非流式 /chat 请求**：

```jsonc
{
  "userId": "uuid",
  "sectionId": "uuid | \"\"", // 空字符串 = daily 模式
  "message": "string",
  "personaId?": "uuid",
  "sessionId?": "string", // 传入则恢复会话
  "modelName?": "string",
  "reasoning?": false,
}
```

响应：`{ interaction_id, session_id, user_message, ai_response, ... }`

**流式 /chat/stream 请求**：

```jsonc
{
  "userId?": "uuid",
  "sectionId?": "uuid | \"\"",
  "message": "string",
  "personaId?": "uuid",
  "sessionId?": "string",
  "daily?": false, // true → daily 模式
  "modelName?": "string",
  "reasoning?": false,
  "useAudio?": false,
  "ttsOption?": ["string"],
}
```

响应：`text/plain` 流

**Daily /daily 请求**：

```jsonc
{
  "message": "string",
  "reasoning?": false,
  "modelName?": "string",
  "useAudio?": false,
  "ttsOption?": ["string"],
}
```

### 评估

| 方法 | 路径                       | 说明                 |
| ---- | -------------------------- | -------------------- |
| POST | `/ai-chat/evaluate`        | LLM 评估简答题       |
| POST | `/ai-chat/learning-review` | 生成学习总结（流式） |

**evaluate 请求**：

```jsonc
{
  "studentAnswer": "string",
  "question": "string",
  "standardAnswer": "string",
  "priorKnowledge?": "string",
  "prompt?": "string",
}
```

响应：`{ reply, score }`

**learning-review 请求**：`{ userId, sectionId, sessionId, modelName? }`
响应：`text/plain` 流

### 会话管理

| 方法 | 路径                                 | 说明                                         |
| ---- | ------------------------------------ | -------------------------------------------- |
| POST | `/ai-chat/sessions/new`              | 创建会话 `{ userId, sectionId, personaId? }` |
| POST | `/ai-chat/switch-persona`            | 切换人设 `{ sessionId, personaId }`          |
| GET  | `/ai-chat/sessionID/by-user-section` | 查询会话列表 `?userId=&sectionId=`           |
| GET  | `/ai-chat/history/:sessionId`        | 对话历史 `?withoutInner=true` 可过滤内部消息 |
| GET  | `/ai-chat/analytics/:sessionId`      | 会话学习分析                                 |

### 配置

| 方法 | 路径                | 说明                                   |
| ---- | ------------------- | -------------------------------------- |
| GET  | `/ai-chat/personas` | AI 人设列表                            |
| GET  | `/ai-chat/models`   | 可用模型列表 `{ all: [...], default }` |

---

## 五、AI 管理

### AI 交互记录 `/ai-interactions`

CRUD · idField: `interaction_id`

```
createAiInteractionSchema:
  user_id: uuid          # 必填
  section_id: uuid       # 必填
  session_id: string     # 必填
  user_message: string   # 必填
  ai_response: string    # 必填
  query_time?: string
  persona_id_in_use?: uuid
```

### AI 人设 `/ai-personas`

CRUD · idField: `persona_id`

```
createAiPersonaSchema:
  name: string           # 必填
  prompt: string         # 必填
  is_default_template?: boolean
```

### 系统提示词 `/system-prompts`

| 方法 | 路径                     | 说明                            |
| ---- | ------------------------ | ------------------------------- |
| GET  | `/system-prompts`        | 全部提示词                      |
| GET  | `/system-prompts/keys`   | 全部 title 列表                 |
| GET  | `/system-prompts/:title` | 按 title 查询                   |
| PUT  | `/system-prompts/:title` | Upsert 提示词 `{ prompt_text }` |

---

## 六、B 站代理

路径前缀：`/proxy/bilibili`

| 方法 | 路径                             | 说明                          |
| ---- | -------------------------------- | ----------------------------- |
| GET  | `/proxy/bilibili/stream`         | 代理视频/音频流（支持 Range） |
| GET  | `/proxy/bilibili/captcha`        | 登录验证码                    |
| POST | `/proxy/bilibili/sms`            | 发送短信验证码                |
| POST | `/proxy/bilibili/login`          | 短信登录，返回 SESSDATA       |
| GET  | `/proxy/bilibili/video-manifest` | 视频 DASH 信息 + MPD 清单     |

**stream** 查询参数：`?url=编码流地址&bvid=BV号`，支持 Range 分段下载

**sms 请求**：`{ source, tel, cid, validate, token, seccode, challenge }`

**login 请求**：`{ source, tel, code, keep, go_url, cid, captcha_key }`

**video-manifest** 查询参数：`?bvid=BVxxx&cid=数字&p=分P序号`
响应：`{ xml, formatList, unifiedMpd, pages }`

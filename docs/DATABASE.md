# 数据库变更管理规范

> 本文档描述开发过程中修改数据库表结构后，如何安全地将变更应用到各环境。

## 架构概述

| 环境 | 数据库        | Schema 同步方式                                     |
| ---- | ------------- | --------------------------------------------------- |
| 开发 | PGlite 嵌入式 | `syncSchema.ts` (建表) + `migrations.ts` (增量迁移) |
| 正式 | PGlite 嵌入式 | 同上，启动时自动执行                                |

双数据库架构：

- **mainDb**：内容数据（课程、章节、小节、练习、AI 人设、系统提示词）
- **userDb**：用户数据（用户、学习记录、会话映射、进度、每日总结）

## 启动时数据库初始化流程

```
initializeDatabase()
  ├── PGlite 实例创建 + waitReady
  ├── syncMainSchema()    ← CREATE TABLE IF NOT EXISTS（冷启动建表）
  ├── syncUserSchema()    ← CREATE TABLE IF NOT EXISTS（冷启动建表）
  └── runMigrations()     ← 增量迁移（ALTER TABLE 等变更，版本化追踪）
```

- `syncSchema.ts`：保证所有表存在（全新安装时一次性建表）
- `migrations.ts`：处理表结构的增量变更（新增列、修改列、删除列等），通过 `_migrations` 表跟踪已执行的版本

## 变更流程

### 第一步：修改 Drizzle Schema

在对应的 schema 文件中修改表定义：

- 主库：`src/db/main/schema.ts`
- 用户库：`src/db/user/schema.ts`

```ts
// 示例：给 exercises 表添加新字段
export const exercises = pgTable('exercises', {
  // ... 已有字段
  difficulty: integer('difficulty').default(1), // ← 新增字段
});
```

### 第二步：添加迁移条目

在 `src/db/migrations.ts` 的 `MIGRATIONS` 数组末尾追加新条目：

```ts
const MIGRATIONS: Migration[] = [
  // ... 已有迁移（不可修改）
  {
    version: 1,
    description: 'exercises 表添加 difficulty 字段',
    target: 'main',
    mainSql: `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;`,
  },
];
```

**Migration 字段说明：**

| 字段          | 类型                         | 说明                                     |
| ------------- | ---------------------------- | ---------------------------------------- |
| `version`     | `number`                     | 递增整数，不可重复                       |
| `description` | `string`                     | 变更描述                                 |
| `target`      | `'main' \| 'user' \| 'both'` | 目标数据库                               |
| `mainSql`     | `string?`                    | 主库 SQL（target 为 main/both 时需要）   |
| `userSql`     | `string?`                    | 用户库 SQL（target 为 user/both 时需要） |

### 第三步：同步 syncSchema.ts

在 `src/db/syncSchema.ts` 对应的 `CREATE TABLE IF NOT EXISTS` 语句中添加新列。

**原因**：`syncSchema.ts` 供全新安装使用，需要包含最新的完整表结构。已有数据库的增量变更由 `migrations.ts` 处理。

### 第四步：验证

```bash
# 类型检查
bun typecheck

# 启动开发服务验证（会自动执行迁移）
bun dev
```

启动时会看到迁移日志：

```
🔄 主库: 1 条待迁移
   ✅ v1: exercises 表添加 difficulty 字段
✅ 数据库迁移完成: 主库 1 条, 用户库 0 条
```

## 变更类型与 SQL 示例

| 变更类型      | SQL 语句                                                            |
| ------------- | ------------------------------------------------------------------- |
| 新增列        | `ALTER TABLE t ADD COLUMN IF NOT EXISTS col TYPE DEFAULT val;`      |
| 删除列        | `ALTER TABLE t DROP COLUMN IF EXISTS col;`                          |
| 修改列类型    | `ALTER TABLE t ALTER COLUMN col TYPE new_type USING col::new_type;` |
| 添加 NOT NULL | `ALTER TABLE t ALTER COLUMN col SET NOT NULL;`                      |
| 去掉 NOT NULL | `ALTER TABLE t ALTER COLUMN col DROP NOT NULL;`                     |
| 设置默认值    | `ALTER TABLE t ALTER COLUMN col SET DEFAULT value;`                 |
| 重命名列      | `ALTER TABLE t RENAME COLUMN old_name TO new_name;`                 |
| 新增索引      | `CREATE INDEX IF NOT EXISTS idx_name ON t (col);`                   |
| 新增唯一约束  | `ALTER TABLE t ADD CONSTRAINT uq_name UNIQUE (col);`                |

## 重要规则

1. **只追加不修改**：`MIGRATIONS` 数组中已有条目不可修改或删除，只能追加
2. **版本号递增**：每个迁移的 `version` 必须大于之前所有迁移
3. **幂等 SQL**：使用 `IF NOT EXISTS` / `IF EXISTS` 保证 SQL 可重复执行
4. **三处同步**：修改 `schema.ts` + 追加 `migrations.ts` + 更新 `syncSchema.ts`
5. **新列默认值**：如果新列标记 `notNull()`，必须提供 `.default()` 或在迁移 SQL 中用 `UPDATE` 填充
6. **迁移失败中止**：任一迁移失败会阻止后续迁移执行，需修复后重启
7. **不可逆操作慎重**：删除列、修改列类型前先评估对线上数据的影响

## 跨版本升级

当从旧版本升级到新版本时（如 v1.0 → v1.5），启动时会依次执行所有未应用的迁移：

```
v1.0 数据库 → 启动 v1.5 应用
  ├── syncSchema: 新表自动创建（IF NOT EXISTS）
  └── migrations: v1 → v2 → v3 → v4 → v5 依次执行
```

`_migrations` 表记录了已执行的版本号，确保不会重复执行。

## 开发环境重置

如果开发数据库结构混乱，可完全重建：

```bash
# 清除数据库文件并重新初始化（会丢失所有数据）
bun db:init:fullinit
```

## 完整示例

假设需要给 `exercises` 表添加 `difficulty` 字段和给 `users` 表添加 `phone` 字段：

```bash
# 1. 修改 src/db/main/schema.ts
#    exercises 表添加: difficulty: integer('difficulty').default(1)

# 2. 修改 src/db/user/schema.ts
#    users 表添加: phone: varchar('phone', { length: 20 })

# 3. 在 src/db/migrations.ts MIGRATIONS 数组追加:
#    { version: 1, description: '添加 difficulty 和 phone 字段', target: 'both',
#      mainSql: 'ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;',
#      userSql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);' }

# 4. 更新 src/db/syncSchema.ts 中对应的 CREATE TABLE 语句

# 5. 类型检查
bun typecheck

# 6. 启动验证（自动执行迁移）
bun dev

# 7. 提交代码
git add -A && git commit -m "feat: exercises 添加 difficulty, users 添加 phone"

# 8. 正式环境部署后重启即自动迁移
```

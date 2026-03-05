import { defineConfig } from 'drizzle-kit';

// 双数据库配置：通过 DB_TARGET 环境变量选择目标库
// 用法：
//   DB_TARGET=main bun db:generate  — 生成主库迁移
//   DB_TARGET=user bun db:generate  — 生成用户库迁移
const target = process.env.DB_TARGET ?? 'main';

const configs = {
  main: defineConfig({
    dialect: 'postgresql',
    schema: './src/db/main/schema.ts',
    out: './drizzle/main',
  }),
  user: defineConfig({
    dialect: 'postgresql',
    schema: './src/db/user/schema.ts',
    out: './drizzle/user',
  }),
} as const;

export default configs[target as keyof typeof configs] ?? configs.main;

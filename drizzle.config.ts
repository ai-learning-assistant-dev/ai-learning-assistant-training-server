import { defineConfig } from 'drizzle-kit';
import { paths } from './src/utils/paths';
import path from 'node:path';

// 双数据库配置：通过 DB_TARGET 环境变量选择目标库
// 用法：
//   DB_TARGET=main bun db:generate  — 生成主库迁移
//   DB_TARGET=user bun db:generate  — 生成用户库迁移
//   DB_TARGET=main bun db:studio:main — 启动主库 Drizzle Studio
//   DB_TARGET=user bun db:studio:user — 启动用户库 Drizzle Studio
const target = process.env.DB_TARGET ?? 'main';

const dbBase = paths.db;

const configs = {
  main: defineConfig({
    dialect: 'postgresql',
    driver: 'pglite',
    dbCredentials: {
      url: path.join(dbBase, 'main'),
    },
    schema: './src/db/main/schema.ts',
    out: './drizzle/main',
  }),
  user: defineConfig({
    dialect: 'postgresql',
    driver: 'pglite',
    dbCredentials: {
      url: path.join(dbBase, 'user'),
    },
    schema: './src/db/user/schema.ts',
    out: './drizzle/user',
  }),
} as const;

export default configs[target as keyof typeof configs] ?? configs.main;

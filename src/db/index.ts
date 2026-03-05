import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { join } from 'node:path';
import { paths } from '../utils/paths';
import logger from '../utils/logger';
import { syncMainSchema, syncUserSchema } from './syncSchema';

import * as mainSchema from './main/schema';
import * as mainRelations from './main/relations';
import * as userSchema from './user/schema';
import * as userRelations from './user/relations';

// ── PGlite 实例 ─────────────────────────────────────

let mainPg: PGlite | null = null;
let userPg: PGlite | null = null;

// ── Drizzle 实例 ────────────────────────────────────

export let mainDb: ReturnType<typeof drizzlePglite<typeof mainSchema & typeof mainRelations>>;
export let userDb: ReturnType<typeof drizzlePglite<typeof userSchema & typeof userRelations>>;

// ── 初始化数据库 ────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
  const mainDbPath = join(paths.db, 'main');
  const userDbPath = join(paths.db, 'user');

  logger.info(`📁 主库路径: ${mainDbPath}`);
  logger.info(`📁 用户库路径: ${userDbPath}`);

  // 创建 PGlite 进程内实例
  mainPg = new PGlite(mainDbPath);
  userPg = new PGlite(userDbPath);

  // 等待 PGlite 就绪
  await mainPg.waitReady;
  await userPg.waitReady;

  // 同步表结构（CREATE TABLE IF NOT EXISTS）
  await syncMainSchema(mainPg);
  await syncUserSchema(userPg);

  // 创建 Drizzle ORM 实例
  mainDb = drizzlePglite(mainPg, { schema: { ...mainSchema, ...mainRelations } });
  userDb = drizzlePglite(userPg, { schema: { ...userSchema, ...userRelations } });

  logger.info('✅ 主数据库已初始化');
  logger.info('✅ 用户数据库已初始化');
}

// ── 创建初始数据 ────────────────────────────────────

export async function createInitialData(): Promise<void> {
  const { users } = userSchema;
  const { count } = await import('drizzle-orm');
  const result = await userDb.select({ value: count() }).from(users);
  const userCount = result[0]?.value ?? 0;

  if (userCount === 0) {
    await userDb.insert(users).values({
      name: '新用户',
      level: 0,
      experience: 0,
    });
    logger.info('✅ 初始测试数据创建成功');
  }
}

// ── 关闭数据库 ──────────────────────────────────────

export async function closeDatabase(): Promise<void> {
  if (mainPg) {
    await mainPg.close();
    mainPg = null;
  }
  if (userPg) {
    await userPg.close();
    userPg = null;
  }
  logger.info('📦 数据库连接已关闭');
}

/**
 * 数据库增量迁移系统
 *
 * 在 syncSchema（冷启动建表）之后运行，处理表结构的增量变更。
 * 使用 _migrations 表记录已执行的迁移版本，启动时自动执行未完成的迁移。
 *
 * 变更流程：
 * 1. 在 schema.ts 中修改 Drizzle 表定义
 * 2. 在本文件 MIGRATIONS 数组中追加新的迁移条目
 * 3. 在 syncSchema.ts 中同步 CREATE TABLE 语句（供全新安装使用）
 * 4. 启动时自动执行待迁移项
 */
import type { PGlite } from '@electric-sql/pglite';
import logger from '../utils/logger';

/** 单条迁移定义 */
interface Migration {
  /** 迁移版本号（递增整数，不可重复） */
  version: number;
  /** 变更描述 */
  description: string;
  /** 目标数据库：main / user / both */
  target: 'main' | 'user' | 'both';
  /** 主库 SQL 语句（target 为 main 或 both 时必填） */
  mainSql?: string;
  /** 用户库 SQL 语句（target 为 user 或 both 时必填） */
  userSql?: string;
}

// ── 迁移列表（只追加，不修改已有条目）────────────────

const MIGRATIONS: Migration[] = [
  // 示例（请勿删除本注释，新迁移追加在此下方）：
  // {
  //   version: 1,
  //   description: 'exercises 表添加 difficulty 字段',
  //   target: 'main',
  //   mainSql: `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;`,
  // },
];

// ── 迁移引擎 ────────────────────────────────────────

const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function getAppliedVersions(pg: PGlite): Promise<Set<number>> {
  await pg.exec(MIGRATION_TABLE_SQL);
  const result = await pg.query<{ version: number }>('SELECT version FROM _migrations ORDER BY version');
  return new Set(result.rows.map(r => r.version));
}

async function markApplied(pg: PGlite, migration: Migration): Promise<void> {
  await pg.exec(`INSERT INTO _migrations (version, description) VALUES (${migration.version}, '${migration.description.replace(/'/g, "''")}') ON CONFLICT (version) DO NOTHING;`);
}

/**
 * 对指定 PGlite 实例执行待迁移项
 */
async function runPendingMigrations(pg: PGlite, dbLabel: 'main' | 'user', migrations: Migration[]): Promise<number> {
  const applied = await getAppliedVersions(pg);
  const pending = migrations
    .filter(m => !applied.has(m.version))
    .filter(m => m.target === dbLabel || m.target === 'both')
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) return 0;

  logger.info(`🔄 ${dbLabel === 'main' ? '主库' : '用户库'}: ${pending.length} 条待迁移`);

  let success = 0;
  for (const migration of pending) {
    const sql = dbLabel === 'main' ? migration.mainSql : migration.userSql;
    if (!sql) {
      // 标记为已应用（该库不需要执行 SQL）
      await markApplied(pg, migration);
      success++;
      continue;
    }

    try {
      await pg.exec(sql);
      await markApplied(pg, migration);
      success++;
      logger.info(`   ✅ v${migration.version}: ${migration.description}`);
    } catch (err) {
      logger.error(`   ❌ v${migration.version}: ${migration.description} — ${(err as Error).message}`);
      // 遇到错误停止，避免后续迁移在不一致状态下运行
      throw new Error(`迁移 v${migration.version} 失败，数据库启动中止`);
    }
  }

  return success;
}

/**
 * 执行全部待迁移（项目启动时在 syncSchema 之后调用）
 */
export async function runMigrations(mainPg: PGlite, userPg: PGlite): Promise<void> {
  if (MIGRATIONS.length === 0) return;

  const mainCount = await runPendingMigrations(mainPg, 'main', MIGRATIONS);
  const userCount = await runPendingMigrations(userPg, 'user', MIGRATIONS);
  const total = mainCount + userCount;

  if (total > 0) {
    logger.info(`✅ 数据库迁移完成: 主库 ${mainCount} 条, 用户库 ${userCount} 条`);
  }
}

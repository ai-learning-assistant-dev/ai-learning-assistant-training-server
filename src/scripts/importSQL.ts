/**
 * SQL 文件导入脚本
 *
 * 将 PostgreSQL dump（INSERT INTO 格式）导入 PGlite 数据库。
 * 根据表名自动分类到主库（mainDb）或用户库（userDb），
 * 使用 PGlite exec() 批量执行，自动处理多行 SQL 语句。
 *
 * 用法:
 *   bun src/scripts/importSQL.ts <sql文件路径> [--clear]
 *
 * 参数:
 *   sql文件路径  要导入的 SQL 文件（默认: db.sql）
 *   --clear      导入前清空目标表，使用 dump 中的 CREATE TABLE 重建表结构
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { paths } from '../utils/paths';
import { syncMainSchema, syncUserSchema } from '../db/syncSchema';
import logger from '../utils/logger';

// ── SQL 预处理（参考 pgLiteWorker.ts）────────────────

function preprocessSqlForPGLite(sql: string): string {
  let s = sql;
  s = s.replace(/SET\s+default_table_access_method\s*=\s*\w+\s*;/gi, '');
  s = s.replace(/COMMENT\s+ON\s+EXTENSION\s+[^;]+;/gi, '');
  s = s.replace(/public\.uuid_generate_v4\(\)/gi, 'gen_random_uuid()');
  s = s.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+["']uuid-ossp["'][^;]*;/gi, '');
  s = s.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+[^;]+WITH\s+SCHEMA\s+public[^;]*;/gi, '');
  s = s.replace(/public\./g, '');
  return s;
}

// ── 表分类映射 ──────────────────────────────────────

const MAIN_DB_TABLES = new Set([
  'ai_personas',
  'courses',
  'chapters',
  'sections',
  'exercises',
  'exercise_options',
  'tests',
  'test_exercises',
  'leading_question',
  'system_prompts',
]);

const SKIP_TABLES = new Set(['checkpoint_blobs', 'checkpoint_writes', 'checkpoints', 'checkpoint_migrations']);

const USER_DB_TABLES = new Set([
  'users',
  'course_schedule',
  'learning_records',
  'titles',
  'ai_interactions',
  'daily_summaries',
  'user_session_mapping',
  'conversation_analytics',
  'user_section_unlock',
  'exercise_results',
  'test_results',
]);

function classifyTable(name: string): 'main' | 'user' | 'skip' {
  if (MAIN_DB_TABLES.has(name)) return 'main';
  if (USER_DB_TABLES.has(name)) return 'user';
  return 'skip';
}

// ── 解析 dump 文件，提取 CREATE TABLE 和 INSERT INTO ─

interface ParsedDump {
  mainCreateSql: string; // DROP + CREATE TABLE SQL
  userCreateSql: string;
  mainInsertSql: string;
  userInsertSql: string;
  mainTables: Set<string>;
  userTables: Set<string>;
  skippedTables: Set<string>;
  mainInsertCount: number;
  userInsertCount: number;
}

function parseDump(content: string): ParsedDump {
  const mainCreates: string[] = [];
  const userCreates: string[] = [];
  const mainInserts: string[] = [];
  const userInserts: string[] = [];
  const mainTables = new Set<string>();
  const userTables = new Set<string>();
  const skippedTables = new Set<string>();

  // 1. 提取 CREATE TABLE 语句（按 CREATE TABLE 边界分割）
  const createChunks = content.split(/(?=^CREATE\s+TABLE\s)/im);
  for (const chunk of createChunks) {
    if (!/^\s*CREATE\s+TABLE\s/i.test(chunk)) continue;

    const match = chunk.match(/^CREATE\s+TABLE\s+(?:\w+\.)?(\w+)\s/i);
    if (!match) continue;
    const tableName = match[1]!;
    const cls = classifyTable(tableName);
    if (cls === 'skip') continue;

    // 截取到闭合的 );
    const endIdx = chunk.indexOf(');');
    if (endIdx < 0) continue;
    // 转为 IF NOT EXISTS 形式，并添加 DROP TABLE
    let createStmt = chunk.substring(0, endIdx + 2);
    createStmt = createStmt.replace(/CREATE\s+TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');

    const dropStmt = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;

    if (cls === 'main') {
      mainCreates.push(dropStmt + '\n' + createStmt);
      mainTables.add(tableName);
    } else {
      userCreates.push(dropStmt + '\n' + createStmt);
      userTables.add(tableName);
    }
  }

  // 2. 提取 INSERT INTO 语句（按 INSERT INTO 边界分割）
  const insertChunks = content.split(/(?=^INSERT\s+INTO\s)/im);
  for (const chunk of insertChunks) {
    if (!/^\s*INSERT\s+INTO\s/i.test(chunk)) continue;

    const match = chunk.match(/^INSERT\s+INTO\s+(?:\w+\.)?(\w+)/i);
    if (!match) continue;
    const tableName = match[1]!;
    const cls = classifyTable(tableName);
    if (cls === 'skip') {
      if (!SKIP_TABLES.has(tableName)) skippedTables.add(tableName);
      continue;
    }

    const lastSemiIdx = chunk.lastIndexOf(';');
    if (lastSemiIdx < 0) continue;
    const stmt = chunk.substring(0, lastSemiIdx + 1);

    if (cls === 'main') {
      mainInserts.push(stmt);
      mainTables.add(tableName);
    } else {
      userInserts.push(stmt);
      userTables.add(tableName);
    }
  }

  return {
    mainCreateSql: mainCreates.join('\n'),
    userCreateSql: userCreates.join('\n'),
    mainInsertSql: mainInserts.join('\n'),
    userInsertSql: userInserts.join('\n'),
    mainTables,
    userTables,
    skippedTables,
    mainInsertCount: mainInserts.length,
    userInsertCount: userInserts.length,
  };
}

// ── 执行 SQL 并处理错误 ─────────────────────────────

async function execSql(pg: PGlite, sql: string, count: number, label: string): Promise<number> {
  if (!sql) return 0;

  try {
    await pg.exec(sql);
    logger.info(`✅ ${label}: 成功导入 ${count} 条`);
    return count;
  } catch (err) {
    logger.warn(`⚠️ ${label} 批量执行失败，回退到逐条执行: ${(err as Error).message.slice(0, 100)}`);

    const stmts = sql.split(/(?=^INSERT\s+INTO\s)/im).filter(s => /^\s*INSERT\s+INTO\s/i.test(s));
    let success = 0;
    let errors = 0;

    for (const stmt of stmts) {
      try {
        await pg.exec(stmt);
        success++;
      } catch (stmtErr) {
        errors++;
        if (errors <= 5) {
          const tbl = stmt.match(/INSERT\s+INTO\s+(\w+)/i)?.[1];
          logger.error(`❌ ${label} [${tbl}]: ${(stmtErr as Error).message.slice(0, 200)}`);
        }
      }
    }

    if (errors > 5) logger.error(`❌ ${label} 共 ${errors} 条失败（仅显示前 5 条）`);
    logger.info(`✅ ${label}: 成功 ${success}/${stmts.length}`);
    return success;
  }
}

// ── 主函数 ──────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const clearFlag = args.includes('--clear');
  const sqlFile = args.find(a => !a.startsWith('--')) ?? 'db.sql';
  const sqlPath = resolve(sqlFile);

  logger.info(`📄 SQL 文件: ${sqlPath}`);
  logger.info(`🗄️  数据库目录: ${paths.db}`);
  if (clearFlag) logger.info('🧹 --clear: 将使用 dump 的 CREATE TABLE 重建表');

  // 读取并预处理
  let content: string;
  try {
    content = readFileSync(sqlPath, 'utf-8');
  } catch {
    logger.error(`❌ 无法读取文件: ${sqlPath}`);
    process.exit(1);
  }
  content = preprocessSqlForPGLite(content);

  // 解析 dump
  logger.info('📝 解析 SQL 文件...');
  const dump = parseDump(content);

  logger.info(`📊 解析结果:`);
  logger.info(`   主库: ${dump.mainInsertCount} 条 INSERT (${[...dump.mainTables].join(', ')})`);
  logger.info(`   用户库: ${dump.userInsertCount} 条 INSERT (${[...dump.userTables].join(', ')})`);
  if (dump.skippedTables.size > 0) logger.info(`   跳过: ${[...dump.skippedTables].join(', ')}`);

  // 初始化 PGlite
  const mainPg = new PGlite(join(paths.db, 'main'));
  const userPg = new PGlite(join(paths.db, 'user'));
  await mainPg.waitReady;
  await userPg.waitReady;

  if (clearFlag) {
    // --clear 模式：用 dump 的 CREATE TABLE 重建表（确保列定义匹配）
    logger.info('🔧 使用 dump 的 CREATE TABLE 重建表...');
    if (dump.mainCreateSql) {
      await mainPg.exec(dump.mainCreateSql);
      logger.info('   ✅ 主库表已重建');
    }
    if (dump.userCreateSql) {
      await userPg.exec(dump.userCreateSql);
      logger.info('   ✅ 用户库表已重建');
    }
    // 同步其余未在 dump 中的表（如 checkpoint 表、新增表等）
    await syncMainSchema(mainPg);
    await syncUserSchema(userPg);
  } else {
    // 非 clear 模式：仅同步 schema（不删表）
    await syncMainSchema(mainPg);
    await syncUserSchema(userPg);
  }

  // 导入
  logger.info('📥 开始导入数据...');
  await execSql(mainPg, dump.mainInsertSql, dump.mainInsertCount, '主库');
  await execSql(userPg, dump.userInsertSql, dump.userInsertCount, '用户库');

  await mainPg.close();
  await userPg.close();
  logger.info('🎉 SQL 导入完成！');
}

main().catch(err => {
  logger.error('❌ SQL 导入失败:', err);
  process.exit(1);
});

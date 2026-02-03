declare var self: Worker;

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { paths } from './paths';
import path from 'node:path';
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';
import { readFileSync } from 'node:fs';

let db: PGlite;
let server: PGLiteSocketServer;

/**
 * 预处理 pg_dump 导出的 SQL 文件，使其兼容 PGLite
 */
function preprocessSqlForPGLite(sql: string): string {
  let processed = sql;

  // 1. 移除或替换 PGLite 不支持的 SET 语句
  processed = processed.replace(/SET\s+default_table_access_method\s*=\s*\w+\s*;/gi, '-- SET default_table_access_method (removed for PGLite);');

  // 2. 移除 COMMENT ON EXTENSION 语句 (PGLite 不支持)
  processed = processed.replace(/COMMENT\s+ON\s+EXTENSION\s+[^;]+;/gi, '-- COMMENT ON EXTENSION (removed for PGLite);');

  // 3. 替换 public.uuid_generate_v4() 为 gen_random_uuid() (PGLite 内置支持)
  processed = processed.replace(/public\.uuid_generate_v4\(\)/gi, 'gen_random_uuid()');

  // 4. 移除 CREATE EXTENSION 语句 (PGLite 可能不支持 uuid-ossp 扩展)
  processed = processed.replace(
    /CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+["']uuid-ossp["'][^;]*;/gi,
    '-- CREATE EXTENSION uuid-ossp (removed for PGLite, using built-in gen_random_uuid);',
  );

  // 5. 移除 WITH SCHEMA public 的扩展创建
  processed = processed.replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+[^;]+WITH\s+SCHEMA\s+public[^;]*;/gi, '-- CREATE EXTENSION with schema (removed for PGLite);');

  return processed;
}

const actions = {
  start: async ({ name, port, backupFile }: { name: string; port: number; backupFile?: string }) => {
    console.log(`Starting PGlite database "${name}" on port ${port}...`);
    db = await PGlite.create({ dataDir: path.join(paths.db, name) });

    if (backupFile) {
      try {
        // 检查数据库是否已有数据（通过检查是否有表）
        const tablesResult = await db.query<{ count: string }>(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
        );
        const tableCount = parseInt(tablesResult.rows[0]?.count || '0', 10);

        if (tableCount > 0) {
          console.log(`数据库已有 ${tableCount} 个表，跳过备份恢复`);
        } else {
          console.log('数据库为空，开始恢复备份...');

          let backup = readFileSync(backupFile, 'utf-8');

          // 预处理 SQL 以兼容 PGLite
          backup = preprocessSqlForPGLite(backup);

          // 使用 exec 直接执行整个 SQL（更高效，且能保持正确的语句顺序）
          await db.exec(backup);

          console.log(`数据库备份恢复完成`);
        }
      } catch (error: any) {
        console.error(`Failed to restore database "${name}":`, error.message);
        // 如果整体执行失败，尝试逐条执行以便定位错误
        console.log('尝试逐条执行 SQL 语句以定位错误...');
        try {
          let backup = readFileSync(backupFile, 'utf-8');
          backup = preprocessSqlForPGLite(backup);

          // 分割成多个语句分别执行，便于定位错误
          const statements = backup.split(/;\s*\n/).filter(s => s.trim());

          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (!stmt || stmt.startsWith('--')) continue;

            // 对 CREATE TABLE 语句输出更多信息以便调试
            const isCreateTable = /^\s*CREATE\s+TABLE/i.test(stmt);
            if (isCreateTable) {
              console.log(`执行 CREATE TABLE 语句 ${i + 1}:`, stmt.slice(0, 100) + '...');
            }

            if (errorCount >= 50) break;

            try {
              await db.exec(stmt + ';');
              successCount++;
            } catch (stmtError: any) {
              errorCount++;
              console.error(`语句 ${i + 1} 执行失败:`);
              console.error(`内容: ${stmt.slice(0, 200)}...`);
              console.error(`错误: ${stmtError.message}\n`);
            }
          }

          console.log(`Database "${name}" restored: ${successCount} 成功, ${errorCount} 失败`);
        } catch (fallbackError: any) {
          console.error('逐条执行也失败:', fallbackError.message);
        }
      }
    }

    server = new PGLiteSocketServer({
      db,
      port,
      host: '127.0.0.1',
      // debug: true,
      connectionQueueTimeout: 10000, // 队列超时时间（毫秒），配合连接池 max:1 使用
    });

    await server.start();
    console.log(`PGlite database "${name}" started on port ${port}`);
    self.postMessage({ event: 'started' });
  },
  close: async () => {
    await server.stop();
    await db.close();
    console.log('Server stopped and database closed');
  },
};

self.onmessage = async event => {
  console.log(event);

  const msg = event.data;
  const action = msg.action as keyof typeof actions;
  const params = msg.params;
  try {
    await actions[action]?.(params);
  } catch (error) {
    console.error(`Error executing action "${action}":`, error);
  }
};
console.log('worker inited');

/**
 * 数据库初始化脚本
 *
 * PGlite 进程内模式无需手动创建数据库，
 * 只需初始化 Drizzle + 执行迁移 + 创建初始数据。
 *
 * 用法: bun src/scripts/initDB.ts
 */
import { initializeDatabase, createInitialData, closeDatabase } from '../db/index';
import logger from '../utils/logger';

async function main() {
  logger.info('🚀 开始初始化数据库...');

  await initializeDatabase();
  logger.info('✅ 数据库连接已建立');

  await createInitialData();
  logger.info('✅ 初始数据创建完成');

  await closeDatabase();
  logger.info('📦 数据库已关闭');

  logger.info('🎉 数据库初始化完成！');
}

main().catch(err => {
  logger.error('❌ 数据库初始化失败:', err);
  process.exit(1);
});

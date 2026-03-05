import { migrate } from 'drizzle-orm/pglite/migrator';
import { mainDb, userDb } from './index';
import logger from '../utils/logger';

/**
 * 执行数据库迁移（应用启动时自动调用）
 *
 * Drizzle 会跟踪 __drizzle_migrations 表，仅执行未应用的迁移。
 * 迁移文件随应用打包分发，Electron 客户端更新时自动升级 schema。
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('🔄 开始执行数据库迁移...');

    await migrate(mainDb, { migrationsFolder: './drizzle/main' });
    logger.info('✅ 主库迁移完成');

    await migrate(userDb, { migrationsFolder: './drizzle/user' });
    logger.info('✅ 用户库迁移完成');
  } catch (error) {
    logger.error('❌ 数据库迁移失败:', error);
    throw error;
  }
}

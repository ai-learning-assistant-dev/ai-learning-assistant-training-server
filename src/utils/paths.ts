import logger from './logger';
import envPaths from 'env-paths';
import { mkdir, mkdirSync } from 'node:fs';
import path from 'node:path';

const rawPaths = envPaths('AILearningAssistantServer', { suffix: '' });

const db = path.resolve(rawPaths.data, 'database');
const isDev = process.env.NODE_ENV !== 'production';
// 开发环境：日志保存到项目根目录的 log 文件夹
const log = isDev ? path.resolve(process.cwd(), 'log') : rawPaths.log;

try {
  mkdirSync(db, { recursive: true });
} catch (error) {
  logger.error('创建数据库目录失败:', error);
}

export const paths = {
  ...rawPaths,
  db,
  log,
};

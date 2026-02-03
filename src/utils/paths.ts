import envPaths from 'env-paths';
import { mkdir, mkdirSync } from 'node:fs';
import path from 'node:path';

const rawPaths = envPaths('AILearningAssistantServer', { suffix: '' });

const db = path.resolve(rawPaths.data, 'database');

try {
  mkdirSync(db, { recursive: true });
} catch (error) {
  console.error('创建数据库目录失败:', error);
}

export const paths = {
  ...rawPaths,
  db,
};

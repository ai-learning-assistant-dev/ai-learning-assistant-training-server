import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

// --- 导入所有实体 ---
import { User } from '../models/user';
import { Course } from '../models/course';
import { Chapter } from '../models/chapter';
import { Section } from '../models/section';
import { Exercise } from '../models/exercise';
import { ExerciseOption } from '../models/exerciseOption';
import { Test } from '../models/test';
import { TestExercise } from '../models/testExercise';
import { LeadingQuestion } from '../models/leadingQuestion';
import { AiPersona } from '../models/aiPersona';
import { CourseSchedule } from '../models/courseSchedule';
import { LearningRecord } from '../models/learningRecord';
import { Title } from '../models/title';
import { AiInteraction } from '../models/aiInteraction';
import { DailySummary } from '../models/dailySummary';
import { UserSessionMapping } from '../models/UserSessionMapping';
import { ConversationAnalytics } from '../models/ConversationAnalytics';
import { UserSectionUnlock } from '../models/userSectionUnlock';
import { ExerciseResult } from '../models/exerciseResult';
import { TestResult } from '../models/testResult';
import { exec } from 'child_process';

dotenv.config();

// --- 实体分组 ---
const mainEntities = [
  Course,
  Chapter,
  Section,
  Exercise,
  ExerciseOption,
  Test,
  TestExercise,
  LeadingQuestion,
  AiPersona,
];

const userEntities = [
  User,
  CourseSchedule,
  LearningRecord,
  Title,
  AiInteraction,
  DailySummary,
  UserSessionMapping,
  ConversationAnalytics,
  UserSectionUnlock,
  ExerciseResult,
  TestResult,
];

// --- 主数据库连接 ---
export const MainDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'ai_learning_assistant',
  // 是否由 TypeORM 自动同步结构（仅开发使用）。生产建议关闭并改用 migration。
  synchronize: (process.env.TYPEORM_SYNC ?? 'true') === 'true',
  logging: false,
  entities: mainEntities,
  migrations: [],
  subscribers: [],
});

// --- 用户数据库连接 ---
export const UserDataSource = new DataSource({
  type: 'postgres',
  host: process.env.USER_DB_HOST || 'localhost',
  port: parseInt(process.env.USER_DB_PORT || '5432', 10),
  username: process.env.USER_DB_USERNAME || 'postgres',
  password: process.env.USER_DB_PASSWORD || 'password',
  database: process.env.USER_DB_DATABASE || 'ai_learning_assistant_users',
  synchronize: (process.env.TYPEORM_SYNC ?? 'true') === 'true',
  logging: false,
  entities: userEntities,
  migrations: [],
  subscribers: [],
});

// --- 数据库存在性检查与创建 ---
async function ensureDatabase(host: string, port: number, username: string, password: string, dbName: string) {
  const client = new Client({ host, port, user: username, password, database: 'postgres' });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ 已创建数据库 ${dbName} (${host}:${port})`);
    } else {
      console.log(`ℹ️ 数据库 ${dbName} 已存在 (${host}:${port})`);
    }
  } finally {
    await client.end();
  }
}

async function ensureAllDatabases() {
  const autoCreate = (process.env.AUTO_CREATE_DB ?? 'true') === 'true';
  if (!autoCreate) {
    console.log('ℹ️ AUTO_CREATE_DB=false 跳过数据库存在性自动创建');
    return;
  }
  await ensureDatabase(
    process.env.DB_HOST || 'localhost',
    parseInt(process.env.DB_PORT || '5432', 10),
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || 'password',
    process.env.DB_DATABASE || 'ai_learning_assistant'
  );
  await ensureDatabase(
    process.env.USER_DB_HOST || process.env.DB_HOST || 'localhost',
    parseInt(process.env.USER_DB_PORT || process.env.DB_PORT || '5432', 10),
    process.env.USER_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    process.env.USER_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    process.env.USER_DB_DATABASE || 'ai_learning_assistant_users'
  );
}

// --- 初始化函数（带数据库自动创建与可选迁移逻辑） ---
export const initializeDataSources = async () => {
  try {
    await ensureAllDatabases();
    await MainDataSource.initialize();
    console.log('Main Data Source has been initialized!');
    await UserDataSource.initialize();
    console.log('User Data Source has been initialized!');

    const useMigrations = (process.env.TYPEORM_MIGRATIONS ?? 'false') === 'true';
    if (useMigrations) {
      console.log('🚧 TYPEORM_MIGRATIONS=true: 运行迁移（当前 migrations 数组为空，需后续添加）。');
      await MainDataSource.runMigrations();
      await UserDataSource.runMigrations();
    } else {
      if ((process.env.TYPEORM_SYNC ?? 'true') !== 'true') {
        console.warn('⚠️ 未启用 synchronize，也未启用 migrations：请确保 schema 已手动迁移。');
      }
    }
  } catch (err) {
    console.error('Error during Data Source initialization:', err);
    throw err;
  }
};

// 已移除旧的 AppDataSource 兼容导出；请直接使用 MainDataSource / UserDataSource。

export async function backupDatabase(){
  if(process.env.IN_DOCKER === 'true'){
    exec('/app/container-script/backup.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`备份出错: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`备份命令错误日志: ${stderr}`);
      }
      console.log(`备份命令常规日志: ${stdout}`);
    });
  }
}
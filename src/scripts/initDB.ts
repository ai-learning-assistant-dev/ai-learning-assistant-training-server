import { Client } from 'pg';
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

// The parameter .env located in the project root directory
const envFile = '.env';
dotenv.config({ path: envFile });

/* 
  当以全量初始化时，也同时初始化前创建.env中配置的用户和数据库
*/
if (process.env.NODE_ENV == "fullinit"){
  console.log("starting fullinit")
  const script = path.resolve(__dirname, 'setup_postgres.sh');
  execSync(`sudo bash "${script}"`, { stdio: 'inherit' });
}

// 统一命名 (主库 + 用户库)，保留旧变量回退
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_DATABASE = process.env.DB_DATABASE || process.env.DB_NAME || 'ai_learning_assistant',
  DB_USERNAME = process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  DB_PASSWORD = process.env.DB_PASSWORD || 'password',
  USER_DB_HOST = process.env.USER_DB_HOST || DB_HOST,
  USER_DB_PORT = process.env.USER_DB_PORT || DB_PORT,
  USER_DB_DATABASE = process.env.USER_DB_DATABASE || 'ai_learning_assistant_users',
  USER_DB_USERNAME = process.env.USER_DB_USERNAME || DB_USERNAME,
  USER_DB_PASSWORD = process.env.USER_DB_PASSWORD || DB_PASSWORD,
} = process.env as any;

async function ensureDatabase(host: string, port: string, database: string, user: string, password: string) {
  const client = new Client({
    host,
    port: parseInt(port, 10),
    user,
    password,
    database: 'postgres',
  });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`✅ 数据库 ${database} 创建成功 (${host}:${port})`);
    } else {
      console.log(`ℹ️ 数据库 ${database} 已存在 (${host}:${port})`);
    }
  } catch (err) {
    console.error(`❌ 数据库 ${database} 检查/创建失败:`, err);
    throw err;
  } finally {
    await client.end();
  }
}

async function createDatabases() {
  await ensureDatabase(DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD);
  await ensureDatabase(USER_DB_HOST, USER_DB_PORT, USER_DB_DATABASE, USER_DB_USERNAME, USER_DB_PASSWORD);
}

createDatabases().catch(() => process.exit(1));

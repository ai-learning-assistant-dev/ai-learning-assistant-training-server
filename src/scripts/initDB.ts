import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const {
  DB_HOST = '',
  DB_PORT = '',
  DB_NAME = '',
  DB_USER = '',
  DB_PASSWORD = '',
} = process.env;

async function createDatabase() {
  const client = new Client({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres', // 连接到默认数据库
  });

  try {
    await client.connect();
    // 检查数据库是否存在
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ 数据库 ${DB_NAME} 创建成功`);
    } else {
      console.log(`ℹ️ 数据库 ${DB_NAME} 已存在`);
    }
  } catch (err) {
    console.error('❌ 创建数据库失败:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();

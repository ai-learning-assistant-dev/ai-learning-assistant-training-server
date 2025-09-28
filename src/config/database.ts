
import { Sequelize } from 'sequelize';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 获取数据库配置
const {
  DB_HOST = '',
  DB_PORT = '',
  DB_NAME = '',
  DB_USER = '',
  DB_PASSWORD = '',
  NODE_ENV = ''
} = process.env;


const clientConfig={
  host: DB_HOST,
  port: parseInt(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: 'postgres' // 连接到默认的 postgres 数据库
};
// 创建默认数据库连接（连接到 postgres 数据库来检查目标数据库是否存在）
const adminClient = new Client(clientConfig);

// 只测试数据库服务器连通性
export const testServerConnection = async (): Promise<boolean> => {
  const client = new Client(clientConfig);
  try {
    await client.connect();
    console.log('✅ PostgreSQL 服务器连通性正常');
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ 无法连接到 PostgreSQL 服务器:', error);
    await client.end().catch(() => {});
    return false;
  }
};

// 检查并创建数据库的函数
export const ensureDatabaseExists = async (): Promise<boolean> => {
  try {
    await adminClient.connect();
    console.log('🔗 连接到 PostgreSQL 服务器...');
    // 检查数据库是否存在
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (result.rows.length === 0) {
      // 数据库不存在，创建它
      console.log(`📊 创建数据库: ${DB_NAME}`);
      await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
      console.log('✅ 数据库创建成功');
    } else {
      console.log(`✅ 数据库 ${DB_NAME} 已存在`);
    }

    await adminClient.end();
    return true;
  } catch (error) {
    console.error('❌ 数据库创建失败:', error);
    await adminClient.end().catch(() => {}); // 安全关闭连接
    return false;
  }
};

// 创建 Sequelize 实例
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  },
  retry: {
    max: 3, // 重试次数
    match: [
      /ConnectionError/,
      /ConnectionRefusedError/,
      /ConnectionTimedOutError/,
      /TimeoutError/
    ]
  }
});

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('✅ DB_HOST',DB_PORT);
    await sequelize.authenticate();
    console.log('✅ PostgreSQL 连接成功');
    return true;
  } catch (error) {
    console.error('❌ 无法连接到数据库:', error);
    return false;
  }
};


export default sequelize;
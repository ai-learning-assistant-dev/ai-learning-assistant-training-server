import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { testConnection,testServerConnection,ensureDatabaseExists } from './config/database';
import { syncDatabase } from './models/index';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

// 导入 tsoa 生成的路由
import { RegisterRoutes } from './build/routes'; //第一次启动报错不用管，直接npm start 就行，后续修改代码不会报错了
import swaggerUi from 'swagger-ui-express';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;



// 中间件配置
app.use(helmet()); // 安全头部
app.use(cors());   // 跨域支持
app.use(morgan('combined')); // 请求日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 注册 tsoa 生成的路由
RegisterRoutes(app);


// 加载由 tsoa 生成的 OpenAPI 规范文件
// 注意：需要先运行 `npm run build:tsoa` 生成这个文件
const swaggerDocument = require('../src/build/swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async (): Promise<void> => {
  try {
    //测试数据库服务器是否能连通
    const ServerConnected =await testServerConnection();
     if (!ServerConnected) {
      throw new Error('无法连接到数据库服务器，服务器启动失败');
    }
    //创建数据库，如果已经创建，就忽略
    const databaseExists = await ensureDatabaseExists();
    if(!databaseExists){
       throw new Error('创建数据库失败');
    }
     // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('无法连接到数据库，服务器启动失败');
    }
    // 同步数据库表结构
    await syncDatabase();

    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器运行在端口 ${PORT}`);
      logger.info(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 健康检查: http://localhost:${PORT}/health`);
      logger.info(`📚 API接口文档: http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    logger.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('🛑 收到关闭信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 收到终止信号，正在关闭服务器...');
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 启动应用
startServer();

export default app;
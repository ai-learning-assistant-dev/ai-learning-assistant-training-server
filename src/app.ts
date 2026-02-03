import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { initializeDataSources } from './config/database';
// 不再单独导入 initDB；数据库创建逻辑已内置于 initializeDataSources()
import { createInitialData } from './models/index';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import swaggerUi from 'swagger-ui-express';
// 导入 tsoa 生成的路由
import { RegisterRoutes } from '../build/routes'; //第一次启动报错不用管，直接npm start 就行，后续修改代码不会报错了
import swaggerDocument from '../build/swagger.json';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const geetestDomains = ['https://api.geetest.com', 'https://static.geetest.com'];

// 中间件配置
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'http://127.0.0.1:7100', 'blob:', 'data:', ...geetestDomains],
        connectSrc: ["'self'", 'blob:', 'blob: http://127.0.0.1:8989', 'data:', 'http://127.0.0.1:8989', ...geetestDomains], // 添加blob:允许blob URL连接
        mediaSrc: ["'self'", 'blob:', 'blob: http://127.0.0.1:8989', 'http://127.0.0.1:8989', ...geetestDomains],
        scriptSrc: ["'self'", 'https://api.geetest.com', ...geetestDomains],
        styleSrc: ["'self'", "'unsafe-inline'", ...geetestDomains],
        imgSrc: ["'self'", 'blob:', 'data:', ...geetestDomains],
        // TODO 这个代码会导致隐私泄漏，只在开发或本地环境使用，不要用在远程生产环境
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginResourcePolicy: {
      policy: 'same-site',
    },
  }),
); // 安全头部
app.use(cors({ origin: ['http://127.0.0.1:3000', 'http://127.0.0.1:7100', 'http://127.0.0.1:8989'] })); // 跨域支持
app.use(morgan('combined')); // 请求日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(express.static('public'));

// 注册 tsoa 生成的路由
RegisterRoutes(app);

// 加载由 tsoa 生成的 OpenAPI 规范文件
// 注意：需要先运行 `npm run build:tsoa` 生成这个文件
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async (): Promise<void> => {
  try {
    // 初始化 TypeORM 数据库连接
    await initializeDataSources();
    // 初始化测试数据（如无用户则插入）
    await createInitialData();
    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器运行在端口 ${PORT}`);
      logger.info(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 健康检查: http://localhost:${PORT}/health`);
      logger.info(`📚 API接口文档: http://localhost:${PORT}/docs`);
      logger.info(`📚 静态文件: http://localhost:${PORT}/`);
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
process.on('uncaughtException', error => {
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

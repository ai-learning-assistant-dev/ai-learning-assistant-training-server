import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/express';
import { isAPIKeyEmpty } from '../llm/utils/modelConfigManager';

// 404 错误处理
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `路由 ${req.method} ${req.originalUrl} 不存在`
  };
  res.status(404).json(response);
};

// 全局错误处理中间件
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`服务器错误: message: ${err.message}, name: ${err.name}, stack: ${err.stack}`);
  
  let statusCode = 500;
  let errorMessage = '服务器内部错误';
  
  // Sequelize 数据库错误
  if (err.name && err.name.includes('Sequelize')) {
    statusCode = 400;
    errorMessage = '数据库操作失败';
  }

  // 大模型认证错误
  if (err.name && err.name.includes('AuthenticationError')) {
    statusCode = 400;
    errorMessage = '大模型认证失败，请检查配置的 API Key 是否正确';
  }

  if (isAPIKeyEmpty == true) {
    statusCode = 400;
    errorMessage = '检测到服务器错误，很可能是未正确配置大模型，请参考使用手册进行配置';
  }
  
  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  };
  
  res.status(statusCode).json(response);
};
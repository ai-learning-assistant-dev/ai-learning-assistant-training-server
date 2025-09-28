import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/express';

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
  console.error('服务器错误:', err);
  
  let statusCode = 500;
  let errorMessage = '服务器内部错误';
  
  // Sequelize 数据库错误
  if (err.name && err.name.includes('Sequelize')) {
    statusCode = 400;
    errorMessage = '数据库操作失败';
  }
  
  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  };
  
  res.status(statusCode).json(response);
};
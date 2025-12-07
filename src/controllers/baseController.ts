import { Controller } from 'tsoa';

export class BaseController extends Controller {
  /**
   * 统一返回分页数据
   */
  protected paginate<T>(rows: T[], total: number, page: number, limit: number, message?: string) {
    return this.ok(rows, message ?? '查询成功', { total, page, limit });
  }
    
  /**
   * 统一返回成功响应
   */
  protected ok<T>(data: T, message?: string, pagination?: {
    page: number;
    limit: number;
    total: number;
  }) {
     message=message ?? "成功"
    return {
      success: true,
      statusCode: 200,
      data,
      ...(message ? { message } : {}),
      ...(pagination ? { pagination } : {})
    };
  }


  /**
   * 统一返回失败响应，statusCode 可选，默认 500
   */
  protected fail(error: string, details?: any,statusCode?: number) {
    this.setStatus(statusCode ?? 500);
    let detailObj = null;
    if (details && (typeof details === 'object' || typeof details === 'string')) {
      detailObj = details;
    }
    return {
      success: false,
      statusCode,
      error,
      details: detailObj
    };
  }
}
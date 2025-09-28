import { Request, Response } from 'express';
import DailySummary from '../models/dailySummary';
import { DailySummaryResponse, CreateDailySummaryRequest, UpdateDailySummaryRequest, DailySummaryListRequest } from '../types/dailySummary';
import { BaseController } from './baseController';
import { Route, Get, Post, Put, Delete, Body, Path, Query, Tags } from 'tsoa';


@Tags('每日总结')
@Route('dailySummary')
export class DailySummaryController extends BaseController {
  /**
   * 新增每日总结
   */
  @Post('/add')
  public async addDailySummary(@Body() body: CreateDailySummaryRequest): Promise<{ success: boolean; statusCode: number; data: DailySummaryResponse | null; message?: string }> {
    try {
      const summary = await DailySummary.create({
        ...body,
        summary_date: new Date(body.summary_date)
      });
      const result: DailySummaryResponse = {
        summary_id: summary.get('summary_id') as number,
        user_id: summary.get('user_id') as number,
        summary_date: (summary.get('summary_date') as Date).toISOString(),
        content: summary.get('content') as string
      };
      return this.ok(result, '新增成功');
    } catch (error) {
  return this.fail('新增失败', error instanceof Error ? error.message : error, 500) as any as { success: boolean; statusCode: number; data: DailySummaryResponse | null; message?: string };
    }
  }

  /**
   * 修改每日总结
   */
  @Put('/update')
  public async updateDailySummary(@Body() body: UpdateDailySummaryRequest): Promise<{ success: boolean; statusCode: number; data: null; message?: string }> {
    try {
      const { summary_id, ...updateFields } = body;
      if (updateFields.summary_date) {
        (updateFields as any).summary_date = new Date(updateFields.summary_date);
      }
      // 只传递合法字段
      const updateObj: any = {};
      if (updateFields.content !== undefined) updateObj.content = updateFields.content;
      if (updateFields.summary_date !== undefined) updateObj.summary_date = (updateFields as any).summary_date;
      const [count] = await DailySummary.update(updateObj, { where: { summary_id } });
  if (count === 0) return { success: false, statusCode: 404, data: null, message: '未找到要更新的记录' };
      return this.ok(null, '更新成功');
    } catch (error) {
  return { success: false, statusCode: 500, data: null, message: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 删除每日总结
   */
  @Delete('/delete/{summary_id}')
  public async deleteDailySummary(@Path() summary_id: number): Promise<{ success: boolean; statusCode: number; data: null; message?: string }> {
    try {
      const count = await DailySummary.destroy({ where: { summary_id } });
  if (count === 0) return { success: false, statusCode: 404, data: null, message: '未找到要删除的记录' };
      return this.ok(null, '删除成功');
    } catch (error) {
  return { success: false, statusCode: 500, data: null, message: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 查询每日总结列表（可选按用户/日期过滤）
   */
  @Post('/list')
  public async listDailySummary(@Body() body: DailySummaryListRequest): Promise<{ success: boolean; statusCode: number; data: DailySummaryResponse[]; message?: string; pagination?: any }> {
    try {
      const { user_id, summary_date, page = 1, limit = 10 } = body;
      const where: any = {};
      if (user_id) where.user_id = user_id;
      if (summary_date) where.summary_date = new Date(summary_date);
      const { rows, count } = await DailySummary.findAndCountAll({
        where,
        offset: (page - 1) * limit,
        limit,
        order: [['summary_date', 'DESC']]
      });
      const result: DailySummaryResponse[] = rows.map(s => ({
        summary_id: s.get('summary_id') as number,
        user_id: s.get('user_id') as number,
        summary_date: (s.get('summary_date') as Date).toISOString(),
        content: s.get('content') as string
      }));
      return this.ok(result, '查询成功', { total: count, page, limit });
    } catch (error) {
  return { success: false, statusCode: 500, data: [], message: error instanceof Error ? error.message : String(error) };
    }
  }
}

import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DailySummary } from '../models/dailySummary';
import { DailySummaryResponse, CreateDailySummaryRequest, UpdateDailySummaryRequest, DailySummaryListRequest } from '../types/dailySummary';
import { BaseController } from './baseController';
import { Route, Get, Post, Put, Delete, Body, Path, Query, Tags } from 'tsoa';
import { ApiResponse } from '../types/express';


@Tags('每日总结')
@Route('dailySummary')
export class DailySummaryController extends BaseController {
    /**
   * 查询每日总结列表（可选按用户/日期过滤）
   */
  @Post('/list')
  public async listDailySummary(@Body() body: DailySummaryListRequest)
  : Promise<ApiResponse<DailySummaryResponse[]>> {
    try {
      const repo = AppDataSource.getRepository(DailySummary);
      const { user_id, summary_date, page = 1, limit = 10 } = body;
      const where: any = {};
      if (user_id) where.user_id = user_id;
      if (summary_date) where.summary_date = new Date(summary_date);
      const [rows, count] = await repo.findAndCount({
        where,
        skip: (page - 1) * limit,
        take: limit,
        order: { summary_date: 'DESC' }
      });
      const result: DailySummaryResponse[] = rows.map(s => ({
        summary_id: s.summary_id,
        user_id: s.user_id,
        summary_date: s.summary_date,
        content: s.content
      }));
       return this.paginate(result, count, page, limit);
    } catch (error) {
       return this.fail('查询每日总结失败', error );
    }
  }
  /**
   * 新增每日总结
   */
  @Post('/add')
  public async addDailySummary(@Body() body: CreateDailySummaryRequest)
  : Promise<ApiResponse<DailySummaryResponse>> {
    try {
      const repo = AppDataSource.getRepository(DailySummary);
      const entity = repo.create({
        ...body,
        summary_date: new Date(body.summary_date)
      });
      const summary = await repo.save(entity);
      const result: DailySummaryResponse = {
        summary_id: summary.summary_id,
        user_id: summary.user_id,
        summary_date: summary.summary_date,
        content: summary.content
      };
      return this.ok(result, '新增成功');
    } catch (error) {
      return this.fail('新增每日总结失败', error );
    }
  }

  /**
   * 修改每日总结
   */
  @Post('/update')
  public async updateDailySummary(@Body() body: UpdateDailySummaryRequest)
  : Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(DailySummary);
      const { summary_id, ...updateFields } = body;
      const summary = await repo.findOneBy({ summary_id });
      if (!summary) {
        return this.fail('未找到要更新的记录 ',null,404);
      }
      if (updateFields.content !== undefined) summary.content = updateFields.content;
      if (updateFields.summary_date !== undefined) summary.summary_date = new Date(updateFields.summary_date);
      await repo.save(summary);
      return this.ok(null, '更新成功');
    } catch (error) {
      return this.fail('更新每日总结失败', error );
    }
  }

  /**
   * 删除每日总结
   */
  @Post('/delete/{summary_id}')
  public async deleteDailySummary(@Path() summary_id: number)
  : Promise<ApiResponse<any>> {
    try {
    const repo = AppDataSource.getRepository(DailySummary);
    const summary = await repo.findOneBy({ summary_id });
    if (!summary) {
      return this.fail('删除每日总结失败',null,404);
    }
    await repo.remove(summary);
    return this.ok(null, '删除成功');
    } catch (error) {
      return this.fail('删除每日总结失败', error );
    }
  }


}

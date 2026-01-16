import { UserDataSource } from '../config/database';
import { LearningRecord } from '../models/learningRecord';
import { ApiResponse } from '../types/express';
import { LearningRecordResponse, CreateLearningRecordRequest, UpdateLearningRecordRequest } from '../types/learningRecord';
import { Route, Get, Post, Body, Path, Tags } from '@/tsoa';
import { BaseController } from './baseController';

@Tags('学习记录表')
@Route('learning-records')
export class LearningRecordController extends BaseController {
  @Post('/search')
  public async searchLearningRecords(@Body() body: { page?: number; limit?: number }): Promise<ApiResponse<LearningRecordResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = UserDataSource.getRepository(LearningRecord);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取学习记录列表失败', error);
    }
  }

  @Post('/getById')
  public async getLearningRecordById(@Body() body: { task_id: string }): Promise<ApiResponse<LearningRecordResponse>> {
    try {
      const repo = UserDataSource.getRepository(LearningRecord);
      const item = await repo.findOneBy({ task_id: body.task_id });
      if (!item) {
        return this.fail('学习记录不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取学习记录失败', error);
    }
  }

  @Post('/add')
  public async addLearningRecord(@Body() requestBody: CreateLearningRecordRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.plan_id || !requestBody.user_id || !requestBody.section_id) {
        return this.fail('plan_id、user_id、section_id 必填', null, 400);
      }
      const repo = UserDataSource.getRepository(LearningRecord);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '学习记录创建成功');
    } catch (error: any) {
      return this.fail('创建学习记录失败', error.message);
    }
  }

  @Post('/update')
  public async updateLearningRecord(@Body() requestBody: UpdateLearningRecordRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.task_id) {
        return this.fail('task_id 必填', null, 400);
      }
      const repo = UserDataSource.getRepository(LearningRecord);
      const item = await repo.findOneBy({ task_id: requestBody.task_id });
      if (!item) {
        return this.fail('学习记录不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '学习记录更新成功');
    } catch (error) {
      return this.fail('更新学习记录失败', error);
    }
  }

  @Post('/delete')
  public async deleteLearningRecord(@Body() body: { task_id: string }): Promise<ApiResponse<any>> {
    try {
      const repo = UserDataSource.getRepository(LearningRecord);
      const item = await repo.findOneBy({ task_id: body.task_id });
      if (!item) {
        return this.fail('学习记录不存在');
      }
      await repo.remove(item);
      return this.ok({}, '学习记录删除成功');
    } catch (error) {
      return this.fail('删除学习记录失败', error);
    }
  }
}


import { AppDataSource } from '../config/database';
import { ExerciseResult } from '../models/exerciseResult';
import { ApiResponse } from '../types/express';
import { Route, Post, Body, Tags } from 'tsoa';
import { BaseController } from './baseController';
import { SaveExerciseResultItem } from '../types/exerciseResult';

@Tags('习题结果表')
@Route('exercise-results')
export class ExerciseResultController extends BaseController {
      /**
   * 批量保存答题结果
   * @param body.list 答案列表，user_id、exercise_id必填，其他选填
   */
  @Post('/saveExerciseResults')
  public async saveExerciseResults(
  @Body() body: { list: SaveExerciseResultItem[] }
  ): Promise<ApiResponse<any>> {
    try {
      if (!body.list || !Array.isArray(body.list) || body.list.length === 0) {
        return this.fail('list 必须为非空数组', null, 400);
      }
      const repo = AppDataSource.getRepository(ExerciseResult);
      // 兼容 result_id/test_result_id 为空字符串或 null
      const toSave = body.list.map(item => ({
        ...item,
        result_id: item.result_id ? item.result_id : undefined,
        test_result_id: item.test_result_id ? item.test_result_id : undefined
      }));
      const addList = toSave.filter(item => !item.result_id);
      const updateList = toSave.filter(item => item.result_id);
      // 新增
      const addEntities = addList.map(item => repo.create(item));
      // 更新
      const updateEntities = [];
      for (const item of updateList) {
        const exist = await repo.findOneBy({ result_id: item.result_id });
        if (exist) {
          Object.assign(exist, item);
          updateEntities.push(exist);
        }
      }
      const savedAdd = addEntities.length > 0 ? await repo.save(addEntities) : [];
      //这里后面可以给用户加经验
      const savedUpdate = updateEntities.length > 0 ? await repo.save(updateEntities) : [];
      return this.ok({ add: savedAdd, update: savedUpdate }, '答题结果保存成功');
    } catch (error) {
      return this.fail('保存答题结果失败', error);
    }
  }
  @Post('/search')
  public async searchExerciseResults(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<ExerciseResult[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(ExerciseResult);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { result_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取答题结果列表失败', error);
    }
  }

  @Post('/getById')
  public async getExerciseResultById(
    @Body() body: { result_id: string }
  ): Promise<ApiResponse<ExerciseResult>> {
    try {
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = await repo.findOneBy({ result_id: body.result_id });
      if (!item) {
        return this.fail('答题结果不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取答题结果失败', error);
    }
  }

  @Post('/add')
  public async addExerciseResult(
    @Body() requestBody: Partial<ExerciseResult>
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.user_id || !requestBody.exercise_id) {
        return this.fail('user_id 和 exercise_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '答题结果创建成功');
    } catch (error: any) {
      return this.fail('创建答题结果失败', error.message);
    }
  }

  @Post('/update')
  public async updateExerciseResult(
    @Body() requestBody: Partial<ExerciseResult>
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.result_id) {
        return this.fail('result_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = await repo.findOneBy({ result_id: requestBody.result_id });
      if (!item) {
        return this.fail('答题结果不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '答题结果更新成功');
    } catch (error) {
      return this.fail('更新答题结果失败', error);
    }
  }

  @Post('/delete')
  public async deleteExerciseResult(
    @Body() body: { result_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(ExerciseResult);
      const item = await repo.findOneBy({ result_id: body.result_id });
      if (!item) {
        return this.fail('答题结果不存在');
      }
      await repo.remove(item);
      return this.ok({}, '答题结果删除成功');
    } catch (error) {
      return this.fail('删除答题结果失败', error);
    }
  }
}

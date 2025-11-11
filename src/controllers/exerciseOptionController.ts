import { MainDataSource } from '../config/database';
import { ExerciseOption } from '../models/exerciseOption';
import { ApiResponse } from '../types/express';
import { ExerciseOptionResponse, CreateExerciseOptionRequest, UpdateExerciseOptionRequest } from '../types/exerciseOption';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("习题选项表")
@Route('exercise-options')
export class ExerciseOptionController extends BaseController {
  @Post('/search')
  public async searchExerciseOptions(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<ExerciseOptionResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
  const repo = MainDataSource.getRepository(ExerciseOption);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { option_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取习题选项列表失败', error );
    }
  }

    @Post('/getById')
    public async getExerciseOptionById(
      @Body() body: { option_id: string }
    ): Promise<ApiResponse<ExerciseOptionResponse>> {
      try {
  const repo = MainDataSource.getRepository(ExerciseOption);
        const option = await repo.findOneBy({ option_id: body.option_id });
        if (!option) {
          return this.fail('选项不存在');
        }
        return this.ok(option);
      } catch (error) {
        return this.fail('获取选项信息失败', error);
      }
    }

  @Post('/add')
  public async addExerciseOption(
    @Body() requestBody: CreateExerciseOptionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.exercise_id || !requestBody.option_text) {
        return this.fail('exercise_id 和 option_text 必填', null, 400);
      }
  const repo = MainDataSource.getRepository(ExerciseOption);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '习题选项创建成功');
    } catch (error: any) {
      return this.fail('创建习题选项失败', error.message);
    }
  }

  @Post('/update')
  public async updateExerciseOption(
    @Body() requestBody: UpdateExerciseOptionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.option_id) {
        return this.fail('option_id 必填', null, 400);
      }
  const repo = MainDataSource.getRepository(ExerciseOption);
      const item = await repo.findOneBy({ option_id: requestBody.option_id });
      if (!item) {
        return this.fail('习题选项不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '习题选项更新成功');
    } catch (error) {
      return this.fail('更新习题选项失败', error );
    }
  }

  @Post('/delete')
  public async deleteExerciseOption(
    @Body() body: { option_id: string }
  ): Promise<ApiResponse<any>> {
    try {
  const repo = MainDataSource.getRepository(ExerciseOption);
      const item = await repo.findOneBy({ option_id: body.option_id });
      if (!item) {
        return this.fail('习题选项不存在');
      }
      await repo.remove(item);
      return this.ok({}, '习题选项删除成功');
    } catch (error) {
      return this.fail('删除习题选项失败', error );
    }
  }
}

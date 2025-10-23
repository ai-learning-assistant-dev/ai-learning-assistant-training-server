import { AppDataSource } from '../config/database';
import { Exercise } from '../models/exercise';
import { ExerciseOption } from '../models/exerciseOption';
import { ApiResponse } from '../types/express';
import { ExerciseResponse, CreateExerciseRequest, UpdateExerciseRequest} from '../types/exercise';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { In } from 'typeorm';
import { BaseController } from './baseController';

@Tags("习题表")
@Route('exercises')
export class ExerciseController extends BaseController {
  @Post('/search')
  public async searchExercises(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<ExerciseResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(Exercise);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { exercise_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取习题列表失败', error );
    }
  }

  @Post('/getById')
  public async getExerciseById(
    @Body() body: { exercise_id: string }
  ): Promise<ApiResponse<ExerciseResponse>> {
    try {
      const repo = AppDataSource.getRepository(Exercise);
      const item = await repo.findOneBy({ exercise_id: body.exercise_id });
      if (!item) {
        return this.fail('习题不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取习题失败', error );
    }
  }

  @Post('/add')
  public async addExercise(
    @Body() requestBody: CreateExerciseRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.question || !requestBody.type_status || !requestBody.answer) {
        return this.fail('题目、类型、答案必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Exercise);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '习题创建成功');
    } catch (error: any) {
      return this.fail('创建习题失败', error.message);
    }
  }

  @Post('/update')
  public async updateExercise(
    @Body() requestBody: UpdateExerciseRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.exercise_id) {
        return this.fail('exercise_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Exercise);
      const item = await repo.findOneBy({ exercise_id: requestBody.exercise_id });
      if (!item) {
        return this.fail('习题不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '习题更新成功');
    } catch (error) {
      return this.fail('更新习题失败', error );
    }
  }

  /**
   * 通过 section_id 查询习题及其选项（type_status=3为多选，不查章节表）
   */
  @Post('/getExercisesWithOptionsBySection')
  public async getExercisesWithOptionsBySection(
    @Body() body: { section_id: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!body.section_id) {
        return this.fail('section_id 必填', null, 400);
      }
      const exerciseRepo = AppDataSource.getRepository(Exercise);
      const optionRepo = AppDataSource.getRepository(ExerciseOption);
      // 查询该节下所有习题
      const exercises = await exerciseRepo.find({ where: { section_id: body.section_id }, order: { exercise_id: 'ASC' } });
      if (!exercises.length) {
        return this.ok([]);
      }
      const exerciseIds = exercises.map(e => e.exercise_id);
      // 查询所有选项
  const options = await optionRepo.find({ where: { exercise_id: In(exerciseIds) } });
      // 组装
      const result = exercises.map(ex => ({
        ...ex,
        options: options.filter(opt => opt.exercise_id === ex.exercise_id),
        isMultiple: ex.type_status === '2'
      }));
      return this.ok(result);
    } catch (error) {
      return this.fail('查询习题及选项失败', error);
    }
  }

  @Post('/delete')
  public async deleteExercise(
    @Body() body: { exercise_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(Exercise);
      const item = await repo.findOneBy({ exercise_id: body.exercise_id });
      if (!item) {
        return this.fail('习题不存在');
      }
      await repo.remove(item);
      return this.ok({}, '习题删除成功');
    } catch (error) {
      return this.fail('删除习题失败', error );
    }
  }
}

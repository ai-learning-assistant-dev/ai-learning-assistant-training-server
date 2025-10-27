import { In } from 'typeorm';
import { Exercise } from '../models/exercise';
import { ExerciseOption } from '../models/exerciseOption';
import { TestExercise } from '../models/testExercise';
import { AppDataSource } from '../config/database';
import { Test } from '../models/test';
import { ApiResponse } from '../types/express';
import { TestResponse, CreateTestRequest, UpdateTestRequest } from '../types/test';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("测试表")
@Route('tests')
export class TestController extends BaseController {
    /**
   * 通过 course_id 查询 tests 及其下所有题目和选项
   */
  @Post('/getTestsWithExercisesByCourse')
  public async getTestsWithExercisesByCourse(
    @Body() body: { course_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      if (!body.course_id) {
        return this.fail('course_id 必填', null, 400);
      }
      const testRepo = AppDataSource.getRepository(Test);
      const testExerciseRepo = AppDataSource.getRepository(TestExercise);
      const exerciseRepo = AppDataSource.getRepository(Exercise);
      const optionRepo = AppDataSource.getRepository(ExerciseOption);
      // 1. 查 tests
      const tests = await testRepo.find({ where: { course_id: body.course_id }, order: { test_id: 'ASC' } });
      if (!tests.length) return this.ok([]);
      const testIds = tests.map(t => t.test_id);
      // 2. 查 test_exercises
      const testExercises = await testExerciseRepo.find({ where: { test_id: In(testIds) } });
      const exerciseIds = testExercises.map(te => te.exercise_id);
      // 3. 查 exercises
      const exercises = exerciseIds.length > 0 ? await exerciseRepo.find({ where: { exercise_id: In(exerciseIds) } }) : [];
      // 4. 查 exercise_options
      const options = exerciseIds.length > 0 ? await optionRepo.find({ where: { exercise_id: In(exerciseIds) } }) : [];
      // 组装
      const exerciseMap = exercises.map(ex => ({
        ...ex,
        options: options.filter(opt => opt.exercise_id === ex.exercise_id)
      }));
      const testMap = tests.map(test => {
        const rels = testExercises.filter(te => te.test_id === test.test_id);
        return {
          ...test,
          exercises: rels.map(rel => exerciseMap.find(ex => ex.exercise_id === rel.exercise_id)).filter(Boolean)
        };
      });
      return this.ok(testMap);
    } catch (error) {
      return this.fail('查询测试及题目失败', error);
    }
  }
  @Post('/search')
  public async searchTests(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<TestResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(Test);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { test_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取测试列表失败', error );
    }
  }

  @Post('/getById')
  public async getTestById(
    @Body() body: { test_id: string }
  ): Promise<ApiResponse<TestResponse>> {
    try {
      const repo = AppDataSource.getRepository(Test);
      const item = await repo.findOneBy({ test_id: body.test_id });
      if (!item) {
        return this.fail('测试不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取测试失败', error );
    }
  }

  @Post('/add')
  public async addTest(
    @Body() requestBody: CreateTestRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.type_status || !requestBody.title) {
        return this.fail('type_status 和 title 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Test);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '测试创建成功');
    } catch (error: any) {
      return this.fail('创建测试失败', error.message);
    }
  }

  @Post('/update')
  public async updateTest(
    @Body() requestBody: UpdateTestRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.test_id) {
        return this.fail('test_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Test);
      const item = await repo.findOneBy({ test_id: requestBody.test_id });
      if (!item) {
        return this.fail('测试不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '测试更新成功');
    } catch (error) {
      return this.fail('更新测试失败', error );
    }
  }

  @Post('/delete')
  public async deleteTest(
    @Body() body: { test_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(Test);
      const item = await repo.findOneBy({ test_id: body.test_id });
      if (!item) {
        return this.fail('测试不存在');
      }
      await repo.remove(item);
      return this.ok({}, '测试删除成功');
    } catch (error) {
      return this.fail('删除测试失败', error );
    }
  }
}

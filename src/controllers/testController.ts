import { In } from 'typeorm';
import { Exercise } from '../models/exercise';
import { ExerciseOption } from '../models/exerciseOption';
import { TestExercise } from '../models/testExercise';
import { MainDataSource, UserDataSource } from '../config/database';
import { Test } from '../models/test';
import { ApiResponse } from '../types/express';
import { TestResponse, CreateTestRequest, UpdateTestRequest } from '../types/test';
import { Route, Get, Post, Body, Path, Tags } from '@/tsoa';
import { BaseController } from './baseController';
import { TestResult } from '../models/testResult';
import { ExerciseResult } from '../models/exerciseResult';

@Tags('测试表')
@Route('tests')
export class TestController extends BaseController {
  /**
   * 通过 course_id 查询 tests 及其下所有题目和选项
   */
  @Post('/getTestsWithExercisesByCourse')
  public async getTestsWithExercisesByCourse(@Body() body: { course_id: string }): Promise<ApiResponse<any>> {
    try {
      if (!body.course_id) {
        return this.fail('course_id 必填', null, 400);
      }
      const testRepo = MainDataSource.getRepository(Test);
      const testExerciseRepo = MainDataSource.getRepository(TestExercise);
      const exerciseRepo = MainDataSource.getRepository(Exercise);
      const optionRepo = MainDataSource.getRepository(ExerciseOption);
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
        options: options.filter(opt => opt.exercise_id === ex.exercise_id),
      }));
      const testMap = tests.map(test => {
        const rels = testExercises.filter(te => te.test_id === test.test_id);
        return {
          ...test,
          exercises: rels.map(rel => exerciseMap.find(ex => ex.exercise_id === rel.exercise_id)).filter(Boolean),
        };
      });
      return this.ok(testMap);
    } catch (error) {
      return this.fail('查询测试及题目失败', error);
    }
  }
  /**
   * 批量保存测试题目答案
   * @param body.list 测试答案列表，user_id、exercise_id必填，其他选填
   */
  @Post('/saveTestResults')
  public async saveTestResults(
    @Body()
    body: {
      user_id: string;
      test_id: string;
      start_date: Date;
      end_date: Date;
      ai_feedback: string | null;
      list: Array<{ exercise_id: string; user_answer?: string | null }>;
    }
  ): Promise<ApiResponse<any>> {
    try {
      if (!body.user_id || !body.test_id || !body.list || !Array.isArray(body.list) || body.list.length === 0) {
        return this.fail('user_id、test_id 和 list 必须传，且 list 为非空数组', null, 400);
      }

      const repo = UserDataSource.getRepository(TestResult);
      const exerciseRepo = MainDataSource.getRepository(Exercise);
      const optionRepo = MainDataSource.getRepository(ExerciseOption);
      const testRepo = MainDataSource.getRepository(Test);
      const exerciseResultRepo = UserDataSource.getRepository(ExerciseResult);

      const results: any[] = [];
      let userTotalScore = 0;
      let totalTestScore = 0;

      // 筛选出 TestResult 看看是不是第一次上传（是否为空），如果是第一次，就保存，不是第一次就修改
      const testWhere: any = { user_id: body.user_id, test_id: body.test_id };
      let existingTestResult = await repo.findOneBy(testWhere);
      let testResultAction = 'created';
      let testResultId: string;

      if (existingTestResult) {
        // 更新现有的 TestResult
        existingTestResult.start_date = body.start_date;
        existingTestResult.end_date = body.end_date;
        existingTestResult.ai_feedback = body.ai_feedback ?? '';
        await repo.save(existingTestResult);
        testResultId = existingTestResult.result_id;
        testResultAction = 'updated';
      } else {
        // 创建新的 TestResult
        const newTestResult = repo.create({
          user_id: body.user_id,
          test_id: body.test_id,
          start_date: body.start_date,
          end_date: body.end_date,
          ai_feedback: body.ai_feedback ?? '',
          score: 0,
        });
        const savedTestResult = await repo.save(newTestResult);
        testResultId = savedTestResult.result_id;
      }

      for (const item of body.list) {
        // 加载习题，计算题目分数
        const exercise = await exerciseRepo.findOneBy({ exercise_id: item.exercise_id });
        const questionScore = exercise?.score || 0;
        totalTestScore += questionScore;

        // 判断是否正确，计算 user_score
        let isCorrect = false;
        const userAnswerRaw = item.user_answer ?? '';
        const typeStatus = exercise?.type_status ?? '';
        if (typeStatus === '0' || typeStatus === '1') {
          // 单选/多选：通过 exercise_options 判断
          const options = await optionRepo.find({ where: { exercise_id: item.exercise_id } });
          const correctIds = options.filter(o => o.is_correct).map(o => o.option_id);
          // 用户答案可能为单个 id 或 多个用 ; 分隔
          const userIds = userAnswerRaw
            ? ('' + userAnswerRaw)
                .split(';')
                .map(s => s.trim())
                .filter(Boolean)
            : [];
          if (typeStatus === '0') {
            // 单选，只有一个正确选项
            isCorrect = userIds.length === 1 && correctIds.length === 1 && userIds[0] === correctIds[0];
          } else {
            // 多选：集合相等
            const uniqUser = Array.from(new Set(userIds));
            const uniqCorrect = Array.from(new Set(correctIds.map(String)));
            if (uniqUser.length === uniqCorrect.length) {
              const allMatch = uniqUser.every(uid => uniqCorrect.includes(uid));
              isCorrect = allMatch;
            } else {
              isCorrect = false;
            }
          }
        } else if (typeStatus === '2') {
          // 简答：与 exercise.answer 比较（忽略大小写及首尾空格）
          const expect = (exercise?.answer ?? '').toString().trim().toLowerCase();
          const actual = (userAnswerRaw ?? '').toString().trim().toLowerCase();
          isCorrect = expect !== '' && expect === actual;
        } else {
          // 未知题型，不计分
          isCorrect = false;
        }

        const user_score = isCorrect ? questionScore : 0;
        userTotalScore += user_score;

        // 在保存
        // 构造查重条件
        const where: any = {
          user_id: body.user_id,
          exercise_id: item.exercise_id,
          test_result_id: testResultId,
        };
        let exist = await exerciseResultRepo.findOneBy(where);
        if (exist) {
          exist.user_answer = userAnswerRaw;
          // 将用户得分写入 result.score 字段
          exist.score = user_score;
          await exerciseResultRepo.save(exist);
          results.push({ ...exist, _action: 'updated', score: questionScore, user_score, ai_feedback: '' });
        } else {
          const toCreate: Partial<ExerciseResult> = {
            user_id: body.user_id,
            exercise_id: item.exercise_id,
            user_answer: userAnswerRaw,
            test_result_id: testResultId, // 这里赋值保存测试结果的id
            score: user_score,
          };
          const entity = exerciseResultRepo.create(toCreate);
          const saved = await exerciseResultRepo.save(entity);
          results.push({ ...saved, _action: 'created', score: questionScore, user_score, ai_feedback: '' });
        }
      }

      // 及格判断
      const pass = totalTestScore > 0 ? userTotalScore / totalTestScore > 0.6 : false;

      // 这里给保存测试结果分数赋值
      if (existingTestResult) {
        existingTestResult.score = userTotalScore;
        await repo.save(existingTestResult);
      } else {
        // 更新新创建的TestResult的分数
        await repo.update(testResultId, { score: userTotalScore });
      }

      return this.ok(
        {
          test_result_action: testResultAction,
          test_result_id: testResultId,
          results,
          total_score: totalTestScore,
          user_score: userTotalScore,
          pass,
          pass_rate: totalTestScore > 0 ? (userTotalScore / totalTestScore) * 100 : 0,
        },
        '测试答题结果批量保存/更新成功'
      );
    } catch (error) {
      return this.fail('保存测试答题结果失败', error);
    }
  }

  @Post('/search')
  public async searchTests(@Body() body: { page?: number; limit?: number }): Promise<ApiResponse<TestResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = MainDataSource.getRepository(Test);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { test_id: 'ASC' },
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取测试列表失败', error);
    }
  }

  @Post('/getById')
  public async getTestById(@Body() body: { test_id: string }): Promise<ApiResponse<TestResponse>> {
    try {
      const repo = MainDataSource.getRepository(Test);
      const item = await repo.findOneBy({ test_id: body.test_id });
      if (!item) {
        return this.fail('测试不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取测试失败', error);
    }
  }

  @Post('/add')
  public async addTest(@Body() requestBody: CreateTestRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.type_status || !requestBody.title) {
        return this.fail('type_status 和 title 必填', null, 400);
      }
      const repo = MainDataSource.getRepository(Test);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '测试创建成功');
    } catch (error: any) {
      return this.fail('创建测试失败', error.message);
    }
  }

  @Post('/update')
  public async updateTest(@Body() requestBody: UpdateTestRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.test_id) {
        return this.fail('test_id 必填', null, 400);
      }
      const repo = MainDataSource.getRepository(Test);
      const item = await repo.findOneBy({ test_id: requestBody.test_id });
      if (!item) {
        return this.fail('测试不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '测试更新成功');
    } catch (error) {
      return this.fail('更新测试失败', error);
    }
  }

  @Post('/delete')
  public async deleteTest(@Body() body: { test_id: string }): Promise<ApiResponse<any>> {
    try {
      const repo = MainDataSource.getRepository(Test);
      const item = await repo.findOneBy({ test_id: body.test_id });
      if (!item) {
        return this.fail('测试不存在');
      }
      await repo.remove(item);
      return this.ok({}, '测试删除成功');
    } catch (error) {
      return this.fail('删除测试失败', error);
    }
  }
}

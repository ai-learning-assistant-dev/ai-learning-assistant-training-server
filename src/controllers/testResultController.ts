import { AppDataSource } from '../config/database';
import { TestResult } from '../models/testResult';
import { ApiResponse } from '../types/express';
import { TestResultResponse, CreateTestResultRequest, UpdateTestResultRequest } from '../types/testResult';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("测试结果表")
@Route('test-results')
export class TestResultController extends BaseController {
  @Post('/list')
  public async listTestResults(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<TestResultResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(TestResult);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { result_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取测试结果列表失败', error );
    }
  }

  @Get('/{result_id}')
  public async getTestResultById(
    @Path() result_id: string
  ): Promise<ApiResponse<TestResultResponse>> {
    try {
      const repo = AppDataSource.getRepository(TestResult);
      const item = await repo.findOneBy({ result_id });
      if (!item) {
        return this.fail('测试结果不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取测试结果失败', error );
    }
  }

  @Post('/add')
  public async addTestResult(
    @Body() requestBody: CreateTestResultRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.user_id || !requestBody.test_id || !requestBody.start_date) {
        return this.fail('user_id、test_id、start_date 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(TestResult);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '测试结果创建成功');
    } catch (error: any) {
      return this.fail('创建测试结果失败', error.message);
    }
  }

  @Post('/update')
  public async updateTestResult(
    @Body() requestBody: UpdateTestResultRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.result_id) {
        return this.fail('result_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(TestResult);
      const item = await repo.findOneBy({ result_id: requestBody.result_id });
      if (!item) {
        return this.fail('测试结果不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '测试结果更新成功');
    } catch (error) {
      return this.fail('更新测试结果失败', error );
    }
  }

  @Post('/delete')
  public async deleteTestResult(
    @Body() body: { result_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(TestResult);
      const item = await repo.findOneBy({ result_id: body.result_id });
      if (!item) {
        return this.fail('测试结果不存在');
      }
      await repo.remove(item);
      return this.ok({}, '测试结果删除成功');
    } catch (error) {
      return this.fail('删除测试结果失败', error );
    }
  }
}

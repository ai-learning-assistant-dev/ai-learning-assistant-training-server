import { AppDataSource } from '../config/database';
import { Test } from '../models/test';
import { ApiResponse } from '../types/express';
import { TestResponse, CreateTestRequest, UpdateTestRequest } from '../types/test';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("测试表")
@Route('tests')
export class TestController extends BaseController {
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

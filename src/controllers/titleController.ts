import { AppDataSource } from '../config/database';
import { Title } from '../models/title';
import { ApiResponse } from '../types/express';
import { TitleResponse, CreateTitleRequest, UpdateTitleRequest } from '../types/title';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("称号表")
@Route('titles')
export class TitleController extends BaseController {
  @Post('/list')
  public async listTitles(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<TitleResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(Title);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { title_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取称号列表失败', error);
    }
  }

  @Get('/{title_id}')
  public async getTitleById(
    @Path() title_id: string
  ): Promise<ApiResponse<TitleResponse>> {
    try {
      const repo = AppDataSource.getRepository(Title);
      const item = await repo.findOneBy({ title_id });
      if (!item) {
        return this.fail('称号不存在');
      }
      return this.ok(item);
    } catch (error) {
  return this.fail('获取称号失败', error);
    }
  }

  @Post('/add')
  public async addTitle(
    @Body() requestBody: CreateTitleRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.course_id || !requestBody.name) {
        return this.fail('course_id 和 name 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Title);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '称号创建成功');
    } catch (error: any) {
      return this.fail('创建称号失败', error.message);
    }
  }

  @Post('/update')
  public async updateTitle(
    @Body() requestBody: UpdateTitleRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.title_id) {
        return this.fail('title_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Title);
      const item = await repo.findOneBy({ title_id: requestBody.title_id });
      if (!item) {
        return this.fail('称号不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '称号更新成功');
    } catch (error) {
      return this.fail('更新称号失败', error);
    }
  }

  @Post('/delete')
  public async deleteTitle(
    @Body() body: { title_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(Title);
      const item = await repo.findOneBy({ title_id: body.title_id });
      if (!item) {
        return this.fail('称号不存在');
      }
      await repo.remove(item);
      return this.ok({}, '称号删除成功');
    } catch (error) {
      return this.fail('删除称号失败', error);
    }
  }
}

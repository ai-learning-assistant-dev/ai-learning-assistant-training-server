import { AppDataSource } from '../config/database';
import { Section } from '../models/section';
import { ApiResponse } from '../types/express';
import { SectionResponse, CreateSectionRequest, UpdateSectionRequest } from '../types/section';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("节表")
@Route('sections')
export class SectionController extends BaseController {
  @Post('/list')
  public async listSections(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<SectionResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(Section);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { section_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取节列表失败', error );
    }
  }

  @Get('/{section_id}')
  public async getSectionById(
    @Path() section_id: string
  ): Promise<ApiResponse<SectionResponse>> {
    try {
      const repo = AppDataSource.getRepository(Section);
      const item = await repo.findOneBy({ section_id });
      if (!item) {
        return this.fail('节不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取节失败', error );
    }
  }

  @Post('/add')
  public async addSection(
    @Body() requestBody: CreateSectionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.title || !requestBody.chapter_id) {
        return this.fail('标题和章节ID必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Section);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '节创建成功');
    } catch (error: any) {
      return this.fail('创建节失败', error.message);
    }
  }

  @Post('/update')
  public async updateSection(
    @Body() requestBody: UpdateSectionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.section_id) {
        return this.fail('section_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Section);
      const item = await repo.findOneBy({ section_id: requestBody.section_id });
      if (!item) {
        return this.fail('节不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '节更新成功');
    } catch (error) {
      return this.fail('更新节失败', error );
    }
  }

  @Post('/delete')
  public async deleteSection(
    @Body() body: { section_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(Section);
      const item = await repo.findOneBy({ section_id: body.section_id });
      if (!item) {
        return this.fail('节不存在');
      }
      await repo.remove(item);
      return this.ok({}, '节删除成功');
    } catch (error) {
      return this.fail('删除节失败', error );
    }
  }
}

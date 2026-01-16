import { MainDataSource } from '../config/database';
import { Chapter } from '../models/chapter';
import { ApiResponse } from '../types/express';
import { ChapterResponse, CreateChapterRequest, UpdateChapterRequest } from '../types/chapter';
import { Route, Get, Post, Body, Path, Tags } from '@/tsoa';
import { BaseController } from './baseController';

@Tags('章节表')
@Route('chapters')
export class ChapterController extends BaseController {
  @Post('/search')
  public async searchChapters(@Body() body: { page?: number; limit?: number }): Promise<ApiResponse<ChapterResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = MainDataSource.getRepository(Chapter);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { chapter_id: 'ASC' },
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取章节列表失败', error);
    }
  }

  @Post('/getById')
  public async getChapterById(@Body() body: { chapter_id: string }): Promise<ApiResponse<ChapterResponse>> {
    try {
      const repo = MainDataSource.getRepository(Chapter);
      const chapter = await repo.findOneBy({ chapter_id: body.chapter_id });
      if (!chapter) {
        return this.fail('章节不存在');
      }
      return this.ok(chapter);
    } catch (error) {
      return this.fail('获取章节失败', error);
    }
  }

  @Post('/add')
  public async addChapter(@Body() requestBody: CreateChapterRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.course_id || !requestBody.title || requestBody.chapter_order === undefined) {
        return this.fail('course_id、title、chapter_order 必填', null, 400);
      }
      const repo = MainDataSource.getRepository(Chapter);
      // 只做章节的基本创建
      const item = repo.create({
        ...requestBody,
      });
      const saved = await repo.save(item);
      return this.ok(saved, '章节创建成功');
    } catch (error: any) {
      return this.fail('创建章节失败', error.message);
    }
  }

  @Post('/update')
  public async updateChapter(@Body() requestBody: UpdateChapterRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.chapter_id) {
        return this.fail('chapter_id 必填', null, 400);
      }
      const repo = MainDataSource.getRepository(Chapter);
      const item = await repo.findOneBy({ chapter_id: requestBody.chapter_id });
      if (!item) {
        return this.fail('章节不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '章节更新成功');
    } catch (error) {
      return this.fail('更新章节失败', error);
    }
  }

  @Post('/delete')
  public async deleteChapter(@Body() body: { chapter_id: string }): Promise<ApiResponse<any>> {
    try {
      const repo = MainDataSource.getRepository(Chapter);
      const item = await repo.findOneBy({ chapter_id: body.chapter_id });
      if (!item) {
        return this.fail('章节不存在');
      }
      await repo.remove(item);
      return this.ok({}, '章节删除成功');
    } catch (error) {
      return this.fail('删除章节失败', error);
    }
  }
}

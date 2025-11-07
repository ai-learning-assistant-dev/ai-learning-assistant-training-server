import { AppDataSource } from '../config/database';
import { Section } from '../models/section';
import { Chapter } from '../models/chapter';
import { ApiResponse } from '../types/express';
import { SectionResponse, CreateSectionRequest, UpdateSectionRequest } from '../types/section';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("节表")
@Route('sections')
export class SectionController extends BaseController {
  @Post('/search')
  public async searchSections(
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

  @Post('/getById')
    public async getSectionById(
      @Body() body: { section_id: string }
    ): Promise<ApiResponse<SectionResponse>> {
    try {
      const repo = AppDataSource.getRepository(Section);
          const item = await repo.findOneBy({ section_id: body.section_id });
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
    if (!requestBody.title || !requestBody.chapter_id || requestBody.section_order === undefined) {
      return this.fail('标题、章节ID和节顺序必填', null, 400);
    }
    
    const sectionRepo = AppDataSource.getRepository(Section);
    const chapterRepo = AppDataSource.getRepository(Chapter);
    
    // 查询对应的章节信息
    const chapter = await chapterRepo.findOne({
      where: { chapter_id: requestBody.chapter_id }
    });
    
    if (!chapter) {
      return this.fail('章节不存在', null, 404);
    }
    
    // 查询该课程中是否有比当前章节 order 更小的章节
    const firstChapter = await chapterRepo.findOne({
      where: { 
        course_id: chapter.course_id 
      },
      order: { chapter_order: 'ASC' }
    });
    
    // 检查当前章节是否是课程的第一个章节
    const isFirstChapter = firstChapter && firstChapter.chapter_id === requestBody.chapter_id;
    
    // 查询该章节中已存在的节，按 section_order 排序
    const existingSections = await sectionRepo.find({
      where: { chapter_id: requestBody.chapter_id },
      order: { section_order: 'ASC' }
    });
    
    // 检查当前节是否是章节的第一个节
    // 如果该章节还没有任何节，或者当前节的 section_order 是最小的
    let isFirstSection = false;
    if (existingSections.length === 0) {
      isFirstSection = true;
    } else {
      // 检查当前节的 section_order 是否小于已存在节的最小 section_order
      const minSectionOrder = existingSections[0].section_order;
      isFirstSection = requestBody.section_order < minSectionOrder;
    }
    
    // 只有当章节是第一个且节也是第一个时，设置 state 为 2
    const State = (isFirstChapter && isFirstSection) ? 2 : 0;
    
    const item = sectionRepo.create({
      ...requestBody,
      unlocked: State
    });
    
    const saved = await sectionRepo.save(item);
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

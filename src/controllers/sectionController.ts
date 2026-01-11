import { MainDataSource } from '../config/database';
import { Section } from '../models/section';
import { Chapter } from '../models/chapter';
import { ApiResponse } from '../types/express';
import { SectionResponse, CreateSectionRequest, UpdateSectionRequest } from '../types/section';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';
import { CourseService } from '../services/courseService';

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
      const repo = MainDataSource.getRepository(Section);
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
      const repo = MainDataSource.getRepository(Section);
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
    
    const sectionRepo = MainDataSource.getRepository(Section);
    const chapterRepo = MainDataSource.getRepository(Chapter);
    
    // 获取章节以找到 course_id
    const chapter = await chapterRepo.findOneBy({ chapter_id: requestBody.chapter_id });
    if (!chapter) {
      return this.fail('章节不存在', null, 400);
    }
    
    // 创建节
    const item = sectionRepo.create({
      ...requestBody
    });
    const saved = await sectionRepo.save(item);
    
    // 更新课程总学时
    await CourseService.updateCourseTotalTime(chapter.course_id);
    
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
      const repo = MainDataSource.getRepository(Section);
      const item = await repo.findOneBy({ section_id: requestBody.section_id });
      if (!item) {
        return this.fail('节不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      
      // 更新课程总学时
      const chapterRepo = MainDataSource.getRepository(Chapter);
      const chapter = await chapterRepo.findOneBy({ chapter_id: item.chapter_id });
      if (chapter) {
        await CourseService.updateCourseTotalTime(chapter.course_id);
      }
      
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
      const repo = MainDataSource.getRepository(Section);
      const item = await repo.findOneBy({ section_id: body.section_id });
      if (!item) {
        return this.fail('节不存在');
      }
      
      // 先获取章节信息以找到 course_id
      const chapterRepo = MainDataSource.getRepository(Chapter);
      const chapter = await chapterRepo.findOneBy({ chapter_id: item.chapter_id });
      const courseId = chapter?.course_id;
      
      await repo.remove(item);
      
      // 更新课程总学时
      if (courseId) {
        await CourseService.updateCourseTotalTime(courseId);
      }
      
      return this.ok({}, '节删除成功');
    } catch (error) {
      return this.fail('删除节失败', error );
    }
  }
}

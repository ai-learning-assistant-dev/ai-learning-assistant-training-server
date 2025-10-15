import { AppDataSource } from '../config/database';
import { Course } from '../models/course';
import { Chapter } from '../models/chapter';
import { Section } from '../models/section';
import { ApiResponse } from '../types/express';
import { CourseResponse, CreateCourseRequest, UpdateCourseRequest } from '../types/course';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { In } from 'typeorm';
import { BaseController } from './baseController';

@Tags("课程表")
@Route('courses')
export class CourseController extends BaseController {
  /**
   * 通过课程ID查询其下所有章节及节
   */
  @Post('/getCourseChaptersSections')
  public async getCourseChaptersSections(
    @Body() body: { course_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      if (!body.course_id) {
        return this.fail('course_id 必填', null, 400);
      }
      const courseRepo = AppDataSource.getRepository(Course);
      const chapterRepo = AppDataSource.getRepository(Chapter);
      const sectionRepo = AppDataSource.getRepository(Section);

      const course = await courseRepo.findOneBy({ course_id: body.course_id });
      if (!course) {
        return this.fail('课程不存在');
      }

      const chapters = await chapterRepo.find({ where: { course_id: body.course_id }, order: { chapter_order: 'ASC' } as any });
      const chapterIds = chapters.map(c => c.chapter_id);
      let sections: Section[] = [];
      if (chapterIds.length > 0) {
        sections = await sectionRepo.find({ where: { chapter_id: In(chapterIds) }, order: { section_order: 'ASC' } as any });
      }

      const chapterList = chapters.map(ch => ({
        ...ch,
        sections: sections.filter(sec => sec.chapter_id === ch.chapter_id)
      }));

      return this.ok({
        course_id: course.course_id,
        course_name: (course as any).name || (course as any).course_name || undefined,
        chapters: chapterList
      });
    } catch (error) {
      return this.fail('查询课程章节/节失败', error);
    }
  }
 

  @Post('/search')
  public async searchCourses(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<CourseResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(Course);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { course_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取课程列表失败', error );
    }
  }

  @Post('/getById')
  public async getCourseById(
    @Body() body:{ course_id: string}
  ): Promise<ApiResponse<CourseResponse>> {
    try {
      const repo = AppDataSource.getRepository(Course);
      const item = await repo.findOneBy({course_id: body.course_id });
      if (!item) {
        return this.fail('课程不存在');
      }
      return this.ok(item);
      } catch (error) {
      return this.fail('获取课程失败', error );
    }
    }

  @Post('/add')
  public async addCourse(
    @Body() requestBody: CreateCourseRequest
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(Course);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '课程创建成功');
    } catch (error: any) {
      return this.fail('创建课程失败', error.message);
    }
  }

  @Post('/update')
  public async updateCourse(
    @Body() requestBody: UpdateCourseRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.course_id) {
        return this.fail('course_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(Course);
      const item = await repo.findOneBy({ course_id: requestBody.course_id });
      if (!item) {
        return this.fail('课程不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '课程更新成功');
    } catch (error) {
      return this.fail('更新课程失败', error );
    }
  }

  @Post('/delete')
  public async deleteCourse(
    @Body() body: { course_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(Course);
      const item = await repo.findOneBy({ course_id: body.course_id });
      if (!item) {
        return this.fail('课程不存在');
      }
      await repo.remove(item);
      return this.ok({}, '课程删除成功');
    } catch (error) {
      return this.fail('删除课程失败', error );
    }
  }
}

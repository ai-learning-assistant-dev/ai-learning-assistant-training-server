import { AppDataSource } from '../config/database';
import { Course } from '../models/course';
import { Chapter } from '../models/chapter';
import { Section } from '../models/section';
import { ApiResponse } from '../types/express';
import { CourseResponse, CreateCourseRequest, UpdateCourseRequest } from '../types/course';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { In } from 'typeorm';
import { UserSectionUnlock } from '../models/userSectionUnlock';
import { BaseController } from './baseController';

@Tags("课程表")
@Route('courses')
export class CourseController extends BaseController {
  /**
   * 通过课程ID查询其下所有章节及节
   */
  @Post('/getCourseChaptersSections')
  public async getCourseChaptersSections(
    @Body() body: { course_id: string, user_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      if (!body.course_id || !body.user_id) {
        return this.fail('course_id 和 user_id 必填', null, 400);
      }
      const courseRepo = AppDataSource.getRepository(Course);
      const chapterRepo = AppDataSource.getRepository(Chapter);
      const sectionRepo = AppDataSource.getRepository(Section);
      const unlockRepo = AppDataSource.getRepository(UserSectionUnlock);

      const course = await courseRepo.findOneBy({ course_id: body.course_id });
      if (!course) {
        return this.fail('课程不存在');
      }

      // 1. 获取课程的完整结构
      const chapters = await chapterRepo.find({ where: { course_id: body.course_id }, order: { chapter_order: 'ASC' } });
      const chapterIds = chapters.map(c => c.chapter_id);
      let sections: Section[] = [];
      if (chapterIds.length > 0) {
        sections = await sectionRepo.find({ where: { chapter_id: In(chapterIds) }, order: { section_order: 'ASC' } });
      }

      // 2. 获取用户在该课程所有相关章节的解锁记录
      const userUnlocks = await unlockRepo.find({
        where: { user_id: body.user_id, chapter_id: In(chapterIds) }
      });
      const unlockMap = new Map(userUnlocks.map(u => [u.section_id, u.unlocked]));

      // 3. 组装数据并应用解锁逻辑
      const chapterList = chapters.map(ch => {
        const chapterSections = sections
          .filter(sec => sec.chapter_id === ch.chapter_id)
          .map(sec => ({ ...sec, unlocked: unlockMap.get(sec.section_id) || 0 }));

        return {
          ...ch,
          unlocked: 0, // 默认锁定，稍后计算
          sections: chapterSections
        };
      });

      // 4. 瀑布式解锁逻辑
      let lastSectionPassed = false; // 用于跟踪上一个section是否通过
      let nextSectionUnlocked = false; // 确保只解锁紧邻的下一个

      // 默认解锁第一章第一节
      if (chapterList.length > 0 && chapterList[0].sections.length > 0) {
        if (chapterList[0].sections[0].unlocked === 0) {
          chapterList[0].sections[0].unlocked = 1;
        }
      }

      for (let i = 0; i < chapterList.length; i++) {
        const chapter = chapterList[i];
        let allSectionsInChapterPassed = chapter.sections.length > 0;
        let chapterInProgress = false;

        for (let j = 0; j < chapter.sections.length; j++) {
          const section = chapter.sections[j];

          // 如果上一个section通过了，并且我们还没解锁下一个，就解锁当前这一个
          if (lastSectionPassed && !nextSectionUnlocked) {
            if (section.unlocked === 0) {
              section.unlocked = 1;
            }
            nextSectionUnlocked = true; // 标记已经解锁了下一个，防止连续解锁
          }

          if (section.unlocked === 2) {
            lastSectionPassed = true;
            nextSectionUnlocked = false; // 重置，为下一个通过的section做准备
          } else {
            lastSectionPassed = false;
            allSectionsInChapterPassed = false;
          }

          if (section.unlocked > 0) {
            chapterInProgress = true;
          }
        }

        // 更新章节状态
        if (allSectionsInChapterPassed) {
          chapter.unlocked = 2;
        } else if (chapterInProgress) {
          chapter.unlocked = 1;
        }

        // 如果整章都通过了，解锁下一章的第一节
        if (chapter.unlocked === 2 && i + 1 < chapterList.length) {
          const nextChapter = chapterList[i + 1];
          if (nextChapter.sections.length > 0 && nextChapter.sections[0].unlocked === 0) {
            nextChapter.sections[0].unlocked = 1;
          }
        }
      }

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

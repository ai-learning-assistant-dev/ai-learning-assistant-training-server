import { MainDataSource, UserDataSource } from '../config/database';
import { Course } from '../models/course';
import { Chapter } from '../models/chapter';
import { Section } from '../models/section';
import { Exercise } from '../models/exercise';
import { ApiResponse } from '../types/express';
import { CourseResponse, CreateCourseRequest, UpdateCourseRequest } from '../types/course';
import { Route, Get, Post, Body, Path, Tags } from '@/tsoa';
import { In } from 'typeorm';
import { UserSectionUnlock } from '../models/userSectionUnlock';
import { BaseController } from './baseController';

@Tags('课程表')
@Route('courses')
export class CourseController extends BaseController {
  /**
   * 通过课程ID查询其下所有章节及节
   */
  @Post('/getCourseChaptersSections')
  public async getCourseChaptersSections(@Body() body: { course_id: string; user_id: string }): Promise<ApiResponse<any>> {
    try {
      if (!body.course_id || !body.user_id) {
        return this.fail('course_id 和 user_id 必填', null, 400);
      }
      const courseRepo = MainDataSource.getRepository(Course);
      const chapterRepo = MainDataSource.getRepository(Chapter);
      const sectionRepo = MainDataSource.getRepository(Section);
      const exerciseRepo = MainDataSource.getRepository(Exercise);
      const unlockRepo = UserDataSource.getRepository(UserSectionUnlock);

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

      // 1.1 查询这些 section 是否有练习
      const sectionIds = sections.map(s => s.section_id);
      let hasExerciseMap = new Map<string, boolean>();
      if (sectionIds.length > 0) {
        const exercises = await exerciseRepo.find({ where: { section_id: In(sectionIds) } });
        const set = new Set(exercises.map(e => e.section_id!));
        hasExerciseMap = new Map(sectionIds.map(id => [id, set.has(id)]));
      }

      // 2. 获取用户在该课程所有相关章节的解锁记录
      const userUnlocks = await unlockRepo.find({
        where: { user_id: body.user_id, chapter_id: In(chapterIds) },
      });
      const unlockMap = new Map(userUnlocks.map(u => [u.section_id, u.unlocked]));

      // 3. 组装数据并应用解锁逻辑
      const chapterList = chapters.map(ch => {
        const chapterSections = sections
          .filter(sec => sec.chapter_id === ch.chapter_id)
          .map(sec => ({
            ...sec,
            unlocked: process.env.UNLOCK_ALL_SECTION == 'true' ? 2 : unlockMap.get(sec.section_id) || 0,
            has_exercise: hasExerciseMap.get(sec.section_id) || false,
          }));

        return {
          ...ch,
          unlocked: 0, // 默认锁定，稍后计算
          sections: chapterSections,
        } as any;
      });

      // 4. 瀑布式解锁逻辑（考虑练习情况并跳过无练习章节）
      let lastSectionPassed = false; // 用于跟踪上一个section是否通过
      let nextSectionUnlocked = false; // 确保只解锁紧邻的下一个

      // 4.1 查找第一个有练习的章节索引，但不预先把前置空章节标为通过
      let firstNonEmptyChapterIndex = -1;
      for (let i = 0; i < chapterList.length; i++) {
        const chapter = chapterList[i];
        const hasExerciseSection = chapter.sections.some((s: any) => s.has_exercise);
        if (hasExerciseSection) {
          firstNonEmptyChapterIndex = i;
          break;
        }
      }

      // 4.2 默认解锁第一个有练习章节的第一节
      if (firstNonEmptyChapterIndex !== -1) {
        const firstChapterWithExercises = chapterList[firstNonEmptyChapterIndex];
        const firstSection = firstChapterWithExercises.sections[0];
        if (firstSection && firstSection.unlocked === 0) {
          firstSection.unlocked = 1;
        }
      }

      for (let i = 0; i < chapterList.length; i++) {
        const chapter = chapterList[i];
        let allSectionsInChapterPassed = chapter.sections.length > 0;
        let chapterInProgress = false;

        for (let j = 0; j < chapter.sections.length; j++) {
          const section = chapter.sections[j];

          // 如果该节没有练习
          if (!section.has_exercise) {
            // 特例：课程起点（第一章第一节）如果没有练习，视为可跳过并标为通过，便于解锁后续节
            if (i === 0 && j === 0) {
              if (section.unlocked === 0) {
                section.unlocked = 2;
              }
              lastSectionPassed = true;
              nextSectionUnlocked = false;
              chapterInProgress = chapterInProgress || section.unlocked > 0;
              continue;
            }
            if (process.env.UNLOCK_ALL_SECTION == 'true') {
              if (section.unlocked === 0) {
                section.unlocked = 2;
              }
              lastSectionPassed = true;
              nextSectionUnlocked = false;
              chapterInProgress = chapterInProgress || section.unlocked > 0;
              continue;
            }

            if (lastSectionPassed) {
              if (section.unlocked === 0) {
                section.unlocked = 2; // 仅在用户到达此节时视为已通过
              }
              lastSectionPassed = true;
              nextSectionUnlocked = false; // 重置，为下一个通过的section做准备
              chapterInProgress = chapterInProgress || section.unlocked > 0;
              continue; // 继续，允许下一节被解锁
            }

            // 用户尚未按顺序推进到这里，保持其原始锁定状态（不自动通过）
            allSectionsInChapterPassed = false;
            continue;
          }

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

        const hasExerciseSection = chapter.sections.some((s: any) => s.has_exercise);

        // 更新章节状态：无练习章节在进度到达时视为通过
        if (!hasExerciseSection) {
          if (lastSectionPassed || chapter.unlocked === 2) {
            chapter.unlocked = 2;
          }
        } else {
          if (allSectionsInChapterPassed) {
            chapter.unlocked = 2;
          } else if (chapterInProgress) {
            chapter.unlocked = 1;
          }
        }

        // 如果整章都通过了，解锁后面第一个有练习章节的第一节，跳过中间无练习章节
        if (chapter.unlocked === 2) {
          let nextIndex = i + 1;
          while (nextIndex < chapterList.length) {
            const nextChapter = chapterList[nextIndex];
            const nextHasExerciseSection = nextChapter.sections.some((s: any) => s.has_exercise);
            if (nextHasExerciseSection) {
              const firstSec = nextChapter.sections[0];
              if (firstSec && firstSec.unlocked === 0) {
                firstSec.unlocked = 1;
              }
              break; // 只解锁最近的一个有练习章节
            } else {
              // 中间无练习章节自动视为通过
              nextChapter.unlocked = 2;
              nextIndex++;
            }
          }
        }
      }

      return this.ok({
        course_id: course.course_id,
        course_name: (course as any).name || (course as any).course_name || undefined,
        chapters: chapterList,
      });
    } catch (error) {
      return this.fail('查询课程章节/节失败', error);
    }
  }

  @Post('/search')
  public async searchCourses(@Body() body: { page?: number; limit?: number }): Promise<ApiResponse<CourseResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = MainDataSource.getRepository(Course);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { course_id: 'ASC' },
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取课程列表失败', error);
    }
  }

  @Post('/getById')
  public async getCourseById(@Body() body: { course_id: string }): Promise<ApiResponse<CourseResponse>> {
    try {
      const repo = MainDataSource.getRepository(Course);
      const item = await repo.findOneBy({ course_id: body.course_id });
      if (!item) {
        return this.fail('课程不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取课程失败', error);
    }
  }

  @Post('/add')
  public async addCourse(@Body() requestBody: CreateCourseRequest): Promise<ApiResponse<any>> {
    try {
      const repo = MainDataSource.getRepository(Course);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '课程创建成功');
    } catch (error: any) {
      return this.fail('创建课程失败', error.message);
    }
  }

  @Post('/update')
  public async updateCourse(@Body() requestBody: UpdateCourseRequest): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.course_id) {
        return this.fail('course_id 必填', null, 400);
      }
      const repo = MainDataSource.getRepository(Course);
      const item = await repo.findOneBy({ course_id: requestBody.course_id });
      if (!item) {
        return this.fail('课程不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '课程更新成功');
    } catch (error) {
      return this.fail('更新课程失败', error);
    }
  }

  @Post('/delete')
  public async deleteCourse(@Body() body: { course_id: string }): Promise<ApiResponse<any>> {
    try {
      const repo = MainDataSource.getRepository(Course);
      const item = await repo.findOneBy({ course_id: body.course_id });
      if (!item) {
        return this.fail('课程不存在');
      }
      await repo.remove(item);
      return this.ok({}, '课程删除成功');
    } catch (error) {
      return this.fail('删除课程失败', error);
    }
  }
}

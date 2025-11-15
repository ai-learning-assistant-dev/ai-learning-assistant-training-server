import { UserDataSource } from '../config/database';
import { CourseSchedule } from '../models/courseSchedule';
import { ApiResponse } from '../types/express';
import { CourseScheduleResponse, CreateCourseScheduleRequest, UpdateCourseScheduleRequest } from '../types/courseSchedule';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("课程安排表")
@Route('course-schedules')
export class CourseScheduleController extends BaseController {
  @Post('/search')
  public async searchCourseSchedules(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<CourseScheduleResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
  const repo = UserDataSource.getRepository(CourseSchedule);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { plan_id: 'ASC' }
      });
      // 类型转换
      const data = items.map(item => ({
        plan_id: item.plan_id,
        user_id: item.user_id,
        course_id: item.course_id,
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status
      }));
      return this.paginate(data, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取课程安排列表失败', error );
    }
  }

  @Post('/getById')
  public async getCourseScheduleById(
    @Body() body: { plan_id: string }
  ): Promise<ApiResponse<CourseScheduleResponse>> {
    try {
  const repo = UserDataSource.getRepository(CourseSchedule);
      const item = await repo.findOneBy({ plan_id: body.plan_id });
      if (!item) {
        return this.fail('课程安排不存在');
      }
      return this.ok({
        plan_id: item.plan_id,
        user_id: item.user_id,
        course_id: item.course_id,
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status
      });
    } catch (error) {
      return this.fail('获取课程安排信息失败', error );
    }
  }

  @Post('/add')
  public async addCourseSchedule(
    @Body() requestBody: CreateCourseScheduleRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.user_id || !requestBody.course_id) {
        return this.fail('user_id 和 course_id 必填', null, 400);
      }
  const repo = UserDataSource.getRepository(CourseSchedule);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok({
        plan_id: saved.plan_id,
        user_id: saved.user_id,
        course_id: saved.course_id,
        start_date: saved.start_date,
        end_date: saved.end_date,
        status: saved.status
      }, '课程安排创建成功');
    } catch (error: any) {
      return this.fail('创建课程安排失败', error.message);
    }
  }

  @Post('/update')
  public async updateCourseSchedule(
    @Body() body: { plan_id: string }
  ): Promise<ApiResponse<any>> {
    try {
  const repo = UserDataSource.getRepository(CourseSchedule);
      const item = await repo.findOneBy({ plan_id: body.plan_id });
      if (!item) {
        return this.fail('课程安排不存在');
      }
      Object.assign(item, body);
      const saved = await repo.save(item);
      return this.ok({
        plan_id: saved.plan_id,
        user_id: saved.user_id,
        course_id: saved.course_id,
        start_date: saved.start_date,
        end_date: saved.end_date,
        status: saved.status
      }, '课程安排更新成功');
    } catch (error) {
      return this.fail('更新课程安排失败', error );
    }
  }

  @Post('/delete')
  public async deleteCourseSchedule(
    @Body() body: { plan_id: string }
  ): Promise<ApiResponse<any>> {
    try {
  const repo = UserDataSource.getRepository(CourseSchedule);
      const item = await repo.findOneBy({ plan_id: body.plan_id });
      if (!item) {
        return this.fail('课程安排不存在');
      }
      await repo.remove(item);
      return this.ok({}, '课程安排删除成功');
    } catch (error) {
      return this.fail('删除课程安排失败', error );
    }
  }
}

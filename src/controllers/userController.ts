
import { MainDataSource, UserDataSource } from '../config/database';
import { User } from '../models/user';
import { ApiResponse} from '../types/express';
import { UserResponse,CreateUserRequest,UpdateUserRequest,UserQueryParams} from '../types/user';
import { Like,In} from 'typeorm';
import { Route, Get, Post, Put, Delete, Body, Query, Path, SuccessResponse, Tags } from 'tsoa';
import { BaseController } from './baseController';
import logger from '../utils/logger';
@Tags("用户表")
@Route('users')
export class UserController extends BaseController {


  /**
   * 获取第一个用户
   */
  @Get('/firstUser')
  public async getFirstUser(): Promise<ApiResponse<any>> {
    try {
  const repo = UserDataSource.getRepository(User);
      const users = await repo.find({ take: 1 });
      if (!users || users.length === 0) {
        return this.fail('没有用户数据');
      }
      return this.ok(users[0]);
    } catch (error) {
      return this.fail('获取第一个用户失败', error);
    }
  }
    /**
     * 通过学员ID查询在学课程
     */
    @Post('/courseChaptersSectionsByUser')
    public async getChaptersAndSectionsByuser_id(
      @Body() body: { user_id: string }
    ): Promise<ApiResponse<any>> {
      try {
        // 1. 查课程安排
      const courseScheduleRepo = UserDataSource.getRepository(require('../models/courseSchedule').CourseSchedule);
      const courseRepo = MainDataSource.getRepository(require('../models/course').Course);
      const chapterRepo = MainDataSource.getRepository(require('../models/chapter').Chapter);
      const sectionRepo = MainDataSource.getRepository(require('../models/section').Section);
        const schedules = await courseScheduleRepo.find({ where: { user_id: body.user_id } });
        const courseIds = schedules.map(s => s.course_id);
        // 2. 查课程
        const courses = await courseRepo.findByIds(courseIds);
        // 3. 查章
        const chapters = await chapterRepo.find({ where: { course_id: In(courseIds) } });
        const chapterIds = chapters.map(ch => ch.chapter_id);
        // 4. 查节
        const sections = await sectionRepo.find({ where: { chapter_id: In(chapterIds) } });
        // 5. 组装结构
        const courseMap = courses.map(course => {
          const courseChapters = chapters.filter(ch => ch.course_id === course.course_id);
          // 计算当前课程所有节的最大 order
          const allSections = courseChapters.flatMap(ch => sections.filter(sec => sec.chapter_id === ch.chapter_id));
          const maxOrder = allSections.length > 0 ? Math.max(...allSections.map(sec => sec.section_order)) : 0;
          // 查当前课程的 schedule，取 status 字段
          const schedule = schedules.find(s => s.course_id === course.course_id);
          const statusNum = schedule && schedule.status ? parseInt(schedule.status, 10) : 0;
          // 计算百分比，查不到数据时为 0
          const percent = maxOrder > 0 ? Math.round((statusNum / maxOrder) * 100) : 0;
          return {
            ...course,
            progress: percent,
            // chapters: courseChapters.map(ch => ({
            //   ...ch,
            //   sections: sections.filter(sec => sec.chapter_id === ch.chapter_id)
            // }))
          };
        });
        return this.ok(courseMap);
      } catch (error) {
        return this.fail('查询课程结构失败', error);
      }
    }
   /**
   * 获取全部课程
   */
  @Get('/allCourses')
  public async getAllCourses(): Promise<ApiResponse<any>> {
    try {
  const repo = MainDataSource.getRepository(require('../models/course').Course);
      const courses = await repo.find();
      return this.ok(courses);
    } catch (error) {
      return this.fail('获取全部课程失败', error);
    }
  }

    /**
   * 测试：通过用户ID连表查询（示例：查询用户及其 daily_summaries表信息）
   */
  @Post('/testJoinById')
  public async testJoinById(
    @Body() body: { user_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      // 使用原生 SQL 连表查询
      // 请根据实际表结构调整 SQL
      const sql = `
        SELECT u.*, s.*
        FROM users u
        LEFT JOIN daily_summaries  s ON u.user_id = s.user_id 
        WHERE u.user_id = :user_id
      `;
      // TypeORM 可用 QueryBuilder 或 Repository 进行连表查询
  const repo = UserDataSource.getRepository(User);
      const user = await repo.findOne({
        where: { user_id: body.user_id },
        relations: ['dailySummaries'] // 需在实体中配置关系
      });
      if (!user) {
        return this.fail('用户不存在');
      }
      return this.ok(user);
    } catch (error) {
      return this.fail('连表查询失败', error);
    }
  }

  /**
   * 根据ID获取单个用户
   */
  @Post('/getById')
  public async getUserById(
    @Body() body: { user_id: string }
  ): Promise<ApiResponse<any>> {
    try {
  const repo = UserDataSource.getRepository(User);
      const user = await repo.findOneBy({ user_id: body.user_id });
      if (!user) {
        return this.fail('用户不存在');
      }
      return this.ok(user);
    } catch (error) {
      return this.fail('获取用户信息失败', error);
    }
  }

  /**
   * 搜索用户（支持用户名模糊搜索和分页）
   */
  @Post('/search')
  public async searchUsers(
    @Body() body: { name?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<UserResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const whereClause: any = {};
      if (body.name) {
        whereClause.name = Like(`%${body.name}%`);
      }
  const repo = UserDataSource.getRepository(User);
      const [users, count] = await repo.findAndCount({
        where: whereClause,
        skip: offset,
        take: limitNum,
        order: { user_id: 'ASC' }
      });
      return this.paginate(users, count, pageNum, limitNum);
    } catch (error) {
      logger.info(error);
      return this.fail('搜索用户失败', error);
    }
  }



  /**
   * 创建新用户
   */
  @Post('/add')
  public async addUser(
    @Body() requestBody: CreateUserRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.name) {
        return this.fail('用户名是必填字段', null, 400);
      }
  const repo = UserDataSource.getRepository(User);
    const user = repo.create(requestBody);
    const saved = await repo.save(user);
    return this.ok(saved, '用户创建成功');
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return this.fail('用户名已存在', null, 400);
      }
      return this.fail('创建用户失败', error);
    }
  }

  /**
   * 更新用户信息
   */
  @Post('/update')
  public async updateUser(
    @Body() requestBody: UpdateUserRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.user_id) {
        return this.fail('user_id 必填', null, 400);
      }
  const repo = UserDataSource.getRepository(User);
      const user = await repo.findOneBy({ user_id: requestBody.user_id });
      if (!user) {
        return this.fail('用户不存在');
      }
      Object.assign(user, requestBody);
      const saved = await repo.save(user);
      return this.ok(saved, '用户信息更新成功');
    } catch (error) {
      return this.fail('更新用户信息失败', error);
    }
  }

  /**
   * 删除用户
   */
  @Post('/delete')
  public async deleteUser(
    @Body() body: { user_id: string }
  ): Promise<ApiResponse<any>> {
    try {
  const repo = UserDataSource.getRepository(User);
      const user = await repo.findOneBy({ user_id: body.user_id });
      if (!user) {
        return this.fail('用户不存在');
      }
      await repo.remove(user);
      return this.ok({}, '用户删除成功');
    } catch (error) {
      return this.fail('删除用户失败', error);
    }
  }
}
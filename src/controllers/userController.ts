
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/user';
import { ApiResponse} from '../types/express';
import { UserResponse,CreateUserRequest,UpdateUserRequest,UserQueryParams} from '../types/user';
import { Like } from 'typeorm';
import { Route, Get, Post, Put, Delete, Body, Query, Path, SuccessResponse, Tags } from 'tsoa';
import { BaseController } from './baseController';
import logger from '../utils/logger';
@Tags("用户表")
@Route('users')
export class UserController extends BaseController {

  /**
   * 测试：通过用户ID连表查询（示例：查询用户及其 daily_summaries表信息）
   */
  @Get('/testJoinById/{userId}')
  public async testJoinById(
    @Path() userId: string
  ): Promise<ApiResponse<any>> {
    try {
      // 使用原生 SQL 连表查询
      // 请根据实际表结构调整 SQL
      const sql = `
        SELECT u.*, s.*
        FROM users u
        LEFT JOIN daily_summaries  s ON u.user_id = s.user_id 
        WHERE u.user_id = :userId
      `;
      // TypeORM 可用 QueryBuilder 或 Repository 进行连表查询
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({
        where: { user_id: userId },
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
   * 通过学员ID查询课程安排及关联课程信息
   */
  @Get('/courseScheduleByUser/{userId}')
  public async getCourseScheduleByUserId(
    @Path() userId: string
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(require('../models/courseSchedule').CourseSchedule);
      const schedules = await repo.find({
        where: { user_id: userId },
        relations: ['course']
      });
      return this.ok(schedules);
    } catch (error) {
      return this.fail('查询课程安排失败', error);
    }
  }
  
  /**
   * 获取所有用户列表（支持分页和过滤）ORM框架查询
   */
  @Post('/list')
  public async listUser(
    @Body() body: { page?: number; limit?: number;}
  ): Promise<ApiResponse<UserResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const whereClause: any = {};
      const repo = AppDataSource.getRepository(User);
      const [users, count] = await repo.findAndCount({
        where: whereClause,
        skip: offset,
        take: limitNum,
        order: { user_id: 'ASC' }
      });
      return this.paginate(users, count, pageNum, limitNum);
    } catch (error) {
      logger.info(error)
      return this.fail('获取用户列表失败', error);
    }
  }

  /**
   * 根据ID获取单个用户
   */
  @Get('/{userId}')
  public async getUserById(
    @Path() userId: string
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOneBy({ user_id: userId });
      if (!user) {
        return this.fail('用户不存在');
      }
      return this.ok(user);
    } catch (error) {
      return this.fail('获取用户信息失败', error);
    }
  }

  /**
   * 搜索用户根据用户名
   */
  @Post('/search')
  public async searchUsers(
    @Query() name?: string
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!name) {
        return this.fail('请提供用户名为搜索条件',null, 400);
      }
      
      const repo = AppDataSource.getRepository(User);
      const whereClause: any = {};
      if (name) {
        whereClause.name = Like(`%${name}%`);
      }
      // email 字段如有可加
      const users = await repo.find({
        where: whereClause,
        take: 20
      });
      return this.ok(users);
    } catch (error) {
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
    const repo = AppDataSource.getRepository(User);
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
      const repo = AppDataSource.getRepository(User);
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
      const repo = AppDataSource.getRepository(User);
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
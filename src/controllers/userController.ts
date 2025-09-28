import { Request, Response } from 'express';
import  User  from '../models/user';
import { ApiResponse} from '../types/express';
import { UserResponse,CreateUserRequest,UpdateUserRequest,UserQueryParams} from '../types/user';
import { Op,QueryTypes} from 'sequelize';
import { Route, Get, Post, Put, Delete, Body, Query, Path, SuccessResponse, Tags } from 'tsoa';
import { BaseController } from './baseController';
@Tags("用户表")
@Route('users')
export class UserController extends BaseController {

  /**
   * 测试：通过用户ID连表查询（示例：查询用户及其 Profile表信息）
   */
  @Get('/testJoinById/{userId}')
  public async testJoinById(
    @Path() userId: number
  ): Promise<ApiResponse<any>> {
    try {
      // 使用原生 SQL 连表查询（假设有 user 和 profile 两张表，profile 有 userId 字段）
      // 请根据实际表结构调整 SQL
      const sql = `
        SELECT u.*, s.*
        FROM users u
        LEFT JOIN daily_summaries  s ON u.user_id = s.user_id 
        WHERE u.user_id = :userId
      `;
      // 通过 User.sequelize 获取 sequelize 实例
      const sequelize = User.sequelize;
      if (!sequelize) {
        return this.fail('数据库连接未初始化');
      }
      const [results] = await sequelize.query(sql, {
        replacements: { userId },
        type: QueryTypes.SELECT
      });
      if (!results || (Array.isArray(results) && results.length === 0)) {
        return this.fail('用户不存在');
      }
      return this.ok(results);
    } catch (error) {
      return this.fail('连表查询失败', error instanceof Error ? error.message : '未知错误');
    }
  }
  
  /**
   * 获取所有用户列表（支持分页和过滤）ORM框架查询
   */
  @Post('/list')
  public async listUser(
    @Body() body: { page?: number; limit?: number; active?: boolean }
  ): Promise<ApiResponse<UserResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const whereClause: any = {};
      if (body.active !== undefined) {
        whereClause.isActive = body.active;
      }
      const users = await User.findAndCountAll({
        where: whereClause,
        limit: limitNum,
        offset: offset,
        order: [['user_id', 'ASC']]
      });
      const userResponses: any[] = users.rows.map((user: any) => user.get ? user.get() : user);
      return this.ok(userResponses, undefined, {
        page: pageNum,
        limit: limitNum,
        total: users.count,
        totalPages: Math.ceil(users.count / limitNum)
      });
    } catch (error) {
      return this.fail('获取用户列表失败', error instanceof Error);
    }
  }

  /**
   * 根据ID获取单个用户
   */
  @Get('/{userId}')
  public async getUserById(
    @Path() userId: number
  ): Promise<ApiResponse<UserResponse>> {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['createdAt', 'updatedAt', 'passwordHash'] }
      });
      
      if (!user) {
        return this.fail('用户不存在');
      }
      
      const data = user.get ? user.get() : user;
      return this.ok(data);
    } catch (error) {
    return this.fail('获取用户信息失败', error instanceof Error);
    }
  }

  /**
   * 搜索用户（根据用户名或邮箱）
   */
  @Get('search')
  public async searchUsers(
    @Query() username?: string,
    @Query() email?: string
  ): Promise<ApiResponse<UserResponse[]>> {
    try {
      if (!username && !email) {
        return this.fail('请提供用户名或邮箱作为搜索条件',null, 400);
      }
      
      const whereClause: any = {};
      if (username) {
        whereClause.username = { [Op.like]: `%${username}%` };
      }
      if (email) {
        whereClause.email = { [Op.like]: `%${email}%` };
      }
      
      const users = await User.findAll({
        where: whereClause,
        attributes: { exclude: ['createdAt', 'updatedAt', 'passwordHash'] },
        limit: 20
      });
      
      const userResponses: any[] = users.map((user: any) => user.get ? user.get() : user);
      return this.ok(userResponses);
    } catch (error) {
      return this.fail('搜索用户失败', error instanceof Error);
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
  const user = await User.create(requestBody);
  const data = user.get ? user.get() : user;
  return this.ok(data, '用户创建成功');
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return this.fail('用户名已存在', null, 400);
      }
      return this.fail('创建用户失败', error.message);
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
      const user = await User.findByPk(requestBody.user_id);
      if (!user) {
        return this.fail('用户不存在');
      }
  await user.update(requestBody);
  const data = user.get ? user.get() : user;
  return this.ok(data, '用户信息更新成功');
    } catch (error) {
      return this.fail('更新用户信息失败', error instanceof Error);
    }
  }

  /**
   * 删除用户
   */
  @Post('/delete')
  public async deleteUser(
    @Body() body: { user_id: number }
  ): Promise<ApiResponse<any>> {
    try {
      const user = await User.findByPk(body.user_id);
      if (!user) {
        return this.fail('用户不存在');
      }
      await user.destroy();
      return this.ok({}, '用户删除成功');
    } catch (error) {
      return this.fail('删除用户失败', error instanceof Error);
    }
  }
}
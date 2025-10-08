import { AppDataSource } from '../config/database';
import { LeadingQuestion } from '../models/leadingQuestion';
import { ApiResponse } from '../types/express';
import { LeadingQuestionResponse, CreateLeadingQuestionRequest, UpdateLeadingQuestionRequest } from '../types/leadingQuestion';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("预设问题表")
@Route('leading-questions')
export class LeadingQuestionController extends BaseController {
  @Post('/search')
  public async searchLeadingQuestions(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<LeadingQuestionResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(LeadingQuestion);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { question_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取预设问题列表失败', error);
    }
  }

    @Post('/getById')
    public async getLeadingQuestionById(
      @Body() body: { question_id: string }
    ): Promise<ApiResponse<LeadingQuestionResponse>> {
    try {
      const repo = AppDataSource.getRepository(LeadingQuestion);
          const item = await repo.findOneBy({ question_id: body.question_id });
      if (!item) {
        return this.fail('预设问题不存在');
      }
      return this.ok(item);
    } catch (error) {
    return this.fail('获取预设问题失败', error);
    }
  }

  @Post('/add')
  public async addLeadingQuestion(
    @Body() requestBody: CreateLeadingQuestionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.section_id || !requestBody.question || !requestBody.answer) {
        return this.fail('section_id、question、answer 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(LeadingQuestion);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '预设问题创建成功');
    } catch (error: any) {
      return this.fail('创建预设问题失败', error.message);
    }
  }

  @Post('/update')
  public async updateLeadingQuestion(
    @Body() requestBody: UpdateLeadingQuestionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.question_id) {
        return this.fail('question_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(LeadingQuestion);
      const item = await repo.findOneBy({ question_id: requestBody.question_id });
      if (!item) {
        return this.fail('预设问题不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, '预设问题更新成功');
    } catch (error) {
      return this.fail('更新预设问题失败', error);
    }
  }

  @Post('/delete')
  public async deleteLeadingQuestion(
    @Body() body: { question_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(LeadingQuestion);
      const item = await repo.findOneBy({ question_id: body.question_id });
      if (!item) {
        return this.fail('预设问题不存在');
      }
      await repo.remove(item);
      return this.ok({}, '预设问题删除成功');
    } catch (error) {
      return this.fail('删除预设问题失败', error);
    }
  }
}

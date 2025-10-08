import { AppDataSource } from '../config/database';
import { AiInteraction } from '../models/aiInteraction';
import { ApiResponse } from '../types/express';
import { AiInteractionResponse, CreateAiInteractionRequest, UpdateAiInteractionRequest } from '../types/aiInteraction';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("AI交互表")
@Route('ai-interactions')
export class AiInteractionController extends BaseController {
  @Post('/search')
  public async searchAiInteractions(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<AiInteractionResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(AiInteraction);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { interaction_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取AI交互列表失败', error);
    }
  }

  @Post('/getById')
  public async getAiInteractionById(
    @Body() body: { interaction_id: string }
  ): Promise<ApiResponse<AiInteractionResponse>> {
    try {
      const repo = AppDataSource.getRepository(AiInteraction);
          const item = await repo.findOneBy({ interaction_id: body.interaction_id });
      if (!item) {
        return this.fail('AI交互不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取AI交互失败', error);
    }
  }

  @Post('/add')
  public async addAiInteraction(
    @Body() requestBody: CreateAiInteractionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.user_id || !requestBody.section_id || !requestBody.session_id) {
        return this.fail('user_id、section_id、session_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(AiInteraction);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, 'AI交互创建成功');
    } catch (error: any) {
      return this.fail('创建AI交互失败', error);
    }
  }

  @Post('/update')
  public async updateAiInteraction(
    @Body() requestBody: UpdateAiInteractionRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.interaction_id) {
        return this.fail('interaction_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(AiInteraction);
      const item = await repo.findOneBy({ interaction_id: requestBody.interaction_id });
      if (!item) {
        return this.fail('AI交互不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, 'AI交互更新成功');
    } catch (error) {
      return this.fail('更新AI交互失败', error );
    }
  }

  @Post('/delete')
  public async deleteAiInteraction(
    @Body() body: { interaction_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(AiInteraction);
      const item = await repo.findOneBy({ interaction_id: body.interaction_id });
      if (!item) {
        return this.fail('AI交互不存在');
      }
      await repo.remove(item);
      return this.ok({}, 'AI交互删除成功');
    } catch (error) {
      return this.fail('删除AI交互失败', error );
    }
  }
}

import { AppDataSource } from '../config/database';
import { AiPersona } from '../models/aiPersona';
import { ApiResponse } from '../types/express';
import { AiPersonaResponse, CreateAiPersonaRequest, UpdateAiPersonaRequest } from '../types/aiPersona';
import { Route, Get, Post, Body, Path, Tags } from 'tsoa';
import { BaseController } from './baseController';

@Tags("AI人设")
@Route('ai-personas')
export class AiPersonaController extends BaseController {
  @Post('/list')
  public async listAiPersonas(
    @Body() body: { page?: number; limit?: number }
  ): Promise<ApiResponse<AiPersonaResponse[]>> {
    try {
      const pageNum = body.page || 1;
      const limitNum = body.limit || 10;
      const offset = (pageNum - 1) * limitNum;
      const repo = AppDataSource.getRepository(AiPersona);
      const [items, count] = await repo.findAndCount({
        skip: offset,
        take: limitNum,
        order: { persona_id: 'ASC' }
      });
      return this.paginate(items, count, pageNum, limitNum);
    } catch (error) {
      return this.fail('获取AI人设列表失败', error );
    }
  }

  @Get('/{persona_id}')
  public async getAiPersonaById(
    @Path() persona_id: string
  ): Promise<ApiResponse<AiPersonaResponse>> {
    try {
      const repo = AppDataSource.getRepository(AiPersona);
      const item = await repo.findOneBy({ persona_id });
      if (!item) {
        return this.fail('AI人设不存在');
      }
      return this.ok(item);
    } catch (error) {
      return this.fail('获取AI人设失败', error );
    }
  }

  @Post('/add')
  public async addAiPersona(
    @Body() requestBody: CreateAiPersonaRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.name || !requestBody.prompt) {
        return this.fail('名称和提示词必填', null, 400);
      }
      const repo = AppDataSource.getRepository(AiPersona);
      const item = repo.create(requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, 'AI人设创建成功');
    } catch (error: any) {
      return this.fail('创建AI人设失败', error.message);
    }
  }

  @Post('/update')
  public async updateAiPersona(
    @Body() requestBody: UpdateAiPersonaRequest
  ): Promise<ApiResponse<any>> {
    try {
      if (!requestBody.persona_id) {
        return this.fail('persona_id 必填', null, 400);
      }
      const repo = AppDataSource.getRepository(AiPersona);
      const item = await repo.findOneBy({ persona_id: requestBody.persona_id });
      if (!item) {
        return this.fail('AI人设不存在');
      }
      Object.assign(item, requestBody);
      const saved = await repo.save(item);
      return this.ok(saved, 'AI人设更新成功');
    } catch (error) {
      return this.fail('更新AI人设失败', error );
    }
  }

  @Post('/delete')
  public async deleteAiPersona(
    @Body() body: { persona_id: string }
  ): Promise<ApiResponse<any>> {
    try {
      const repo = AppDataSource.getRepository(AiPersona);
      const item = await repo.findOneBy({ persona_id: body.persona_id });
      if (!item) {
        return this.fail('AI人设不存在');
      }
      await repo.remove(item);
      return this.ok({}, 'AI人设删除成功');
    } catch (error) {
      return this.fail('删除AI人设失败', error );
    }
  }
}

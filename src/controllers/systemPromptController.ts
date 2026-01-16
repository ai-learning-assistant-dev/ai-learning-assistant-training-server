import { Route, Tags, Post, Put, Body, Get, Path } from '@/tsoa';
import { BaseController } from './baseController';
import { SystemPrompt } from '../models/systemPrompt';
import { updateSystemPrompt, getAllSystemPrompts, getSystemPromptByTitle, getAllSystemPromptKeys } from '../services/systemPromptService';
import { ApiResponse } from '../types/express';

interface UpdateSystemPromptRequest {
  prompt_text: string;
}

@Tags('System Prompts')
@Route('system-prompts')
export class SystemPromptController extends BaseController {
  /** Update an existing system prompt by title (title is primary key) */
  @Put('{title}')
  public async update(@Path() title: string, @Body() req: UpdateSystemPromptRequest): Promise<ApiResponse<SystemPrompt>> {
    try {
      if (!req.prompt_text) {
        throw new Error('prompt_text is required');
      }
      const saved = await updateSystemPrompt(title, req.prompt_text);
      return this.ok(saved);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not found')) {
        return this.fail('SystemPrompt not found', null, 404);
      }
      throw this.fail('Update SystemPrompt failed', message);
    }
  }

  /** Get all system prompts */
  @Get('/')
  public async getAll(): Promise<ApiResponse<SystemPrompt[]>> {
    try {
      const items = await getAllSystemPrompts();
      return this.ok(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw this.fail('Get all SystemPrompts failed', message);
    }
  }

  /** Get list of all prompt titles (keys) */
  @Get('keys')
  public async getAllKey(): Promise<ApiResponse<string[]>> {
    try {
      const keys = await getAllSystemPromptKeys();
      return this.ok(keys);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw this.fail('Get SystemPrompt keys failed', message);
    }
  }

  /** Get a single system prompt by title (primary key) */
  @Get('{title}')
  public async getByTitle(@Path() title: string): Promise<ApiResponse<SystemPrompt>> {
    try {
      const item = await getSystemPromptByTitle(title);
      if (!item) {
        return this.fail('SystemPrompt not found', null, 404);
      }
      return this.ok(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw this.fail('Get SystemPrompt failed', message);
    }
  }
}

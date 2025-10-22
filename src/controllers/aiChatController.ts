import { Request, Response } from 'express';
import { Route, Get, Post, Body, Path, Tags, Res, TsoaResponse } from 'tsoa';
import { BaseController } from './baseController';
import { 
  createLearningAssistant, 
  startNewLearningSession,
  resumeLearningSession,
  LearningAssistant 
} from '../llm/domain/learning_assistant';
import { AppDataSource } from '../config/database';
import { AiInteraction } from '../models/aiInteraction';
import { ApiResponse } from '../types/express';
import { 
  ChatRequest, 
  StreamChatRequest, 
  CreateSessionRequest, 
  ChatResponse, 
  SessionInfo 
} from '../types/AiChat';

/**
 * 集成LLM Agent的AI聊天控制器
 */
@Tags("AI聊天")
@Route('ai-chat')
export class AiChatController extends BaseController {

  /**
   * 与AI助手进行对话
   */
  @Post('/chat')
  public async chat(@Body() request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    try {
      const { userId, sectionId, message, personaId, sessionId } = request;

      // 验证必要参数
      if (!userId || !sectionId || !message) {
        throw new Error('缺少必要参数：userId, sectionId, message');
      }

      let assistant: LearningAssistant;

      if (sessionId) {
        // 恢复现有会话
        assistant = await resumeLearningSession(userId, sessionId);
      } else {
        // 创建新会话
        assistant = await createLearningAssistant(userId, sectionId, personaId);
      }

      // 与AI进行对话 - 普通模式
      const aiResponse = await assistant.chat(message);

      const result: ChatResponse = {
        interaction_id: `${assistant.getSessionId()}_${Date.now()}`,
        user_id: userId,
        section_id: sectionId,
        session_id: assistant.getSessionId(),
        user_message: message,
        ai_response: aiResponse,
        query_time: new Date(),
        persona_id_in_use: personaId
      };

      // 清理资源
      await assistant.cleanup();

      return this.ok(result);

    } catch (error) {
      console.error('AI助手对话失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail(`AI助手对话失败`,errorMessage);
    }
  }

  /**
   * 与AI助手进行流式对话
   */
  @Post('/chat/stream')
  public async chatStream(
    @Body() request: StreamChatRequest
  ): Promise<ApiResponse<any>> {
    try {
      const { userId, sectionId, message, personaId, sessionId } = request;

      // 验证必要参数
      if (!userId || !sectionId || !message) {
        throw new Error('缺少必要参数：userId, sectionId, message');
      }

      let assistant: LearningAssistant;

      try {
        if (sessionId) {
          // 恢复现有会话
          assistant = await resumeLearningSession(userId, sessionId);
        } else {
          // 创建新会话
          assistant = await createLearningAssistant(userId, sectionId, personaId);
        }

        // 收集所有流式内容
        const chunks: string[] = [];
        let fullResponse = '';
        
        for await (const chunk of assistant.chatStream(message)) {
          chunks.push(chunk);
          fullResponse += chunk;
        }

        // 返回流式处理结果
        const result = {
          interaction_id: `${assistant.getSessionId()}_${Date.now()}`,
          session_id: assistant.getSessionId(),
          user_id: userId,
          section_id: sectionId,
          persona_id_in_use: personaId,
          user_message: message,
          ai_response: fullResponse,
          chunks: chunks,
          chunk_count: chunks.length,
          query_time: new Date().toISOString(),
          streaming: true
        };

        // 清理资源
        await assistant.cleanup();

        return this.ok(result);

      } catch (streamError) {
        const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
        throw this.fail('流式处理错误', errorMessage);
      }

    } catch (error) {
      console.error('流式AI对话失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail('流式AI对话失败', errorMessage);
    }
  }

  /**
   * 获取用户的学习会话列表
   */
  @Get('/sessions/{userId}')
  public async getUserSessions(
    @Path() userId: string
  ): Promise<ApiResponse<any[]>> {
    try {
      if (!userId) {
        throw new Error('缺少用户ID参数');
      }

      // todo: 这块不太对，需要改一下
      // 创建临时助手实例来访问存储功能，使用一个有效的UUID格式
      const tempSectionId = '00000000-0000-0000-0000-000000000001';
      const assistant = await createLearningAssistant(userId, tempSectionId);
      const sessions = await assistant.getUserSectionSessions();
      await assistant.cleanup();

      return this.ok(sessions);

    } catch (error) {
      console.error('获取用户会话失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail("获取用户会话失败",errorMessage);
    }
  }

  /**
   * 获取会话的对话历史
   */
  @Get('/history/{sessionId}')
  public async getSessionHistory(@Path() sessionId: string): Promise<ApiResponse<{
    session_id: string;
    message_count: number;
    history: any[];
  }>> {
    try {
      if (!sessionId) {
          this.fail("缺少会话ID参数",null,404);
      }

      // 通过现有的 AiInteraction 表查询历史记录
      const aiInteractionRepo = AppDataSource.getRepository(AiInteraction);
      const interactions = await aiInteractionRepo.find({
        where: { session_id: sessionId },
        order: { query_time: 'ASC' },
        relations: ['user', 'section', 'persona']
      });

      // 转换为对话格式
      const history = interactions.map(interaction => ({
        interaction_id: interaction.interaction_id,
        user_message: interaction.user_message,
        ai_response: interaction.ai_response,
        query_time: interaction.query_time,
        user_name: interaction.user?.name,
        section_title: interaction.section?.title,
        persona_name: interaction.persona?.name
      }));

      return this.ok({
        session_id: sessionId,
        message_count: interactions.length,
        history: history
      });

    } catch (error) {
      console.error('获取会话历史失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail(`获取会话历史失败`,errorMessage);
    }
  }

  /**
   * 开始新的学习会话
   */
  @Post('/sessions/new')
  public async startNewSession(@Body() request: CreateSessionRequest): Promise<ApiResponse<SessionInfo>> {
    try {
      const { userId, sectionId, personaId } = request;

      if (!userId || !sectionId) {
        throw new Error('缺少必要参数：userId, sectionId');
      }

      const assistant = await startNewLearningSession(userId, sectionId, personaId);
      const sessionId = assistant.getSessionId();
      await assistant.cleanup();

      return this.ok({
        session_id: sessionId,
        user_id: userId,
        section_id: sectionId,
        persona_id: personaId,
        created_at: new Date()
      });

    } catch (error) {
      console.error('创建新会话失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail("创建新会话失败",errorMessage) ;
    }
  }

  /**
   * 获取会话分析统计
   */
  @Get('/analytics/{sessionId}')
  public async getSessionAnalytics(@Path() sessionId: string): Promise<ApiResponse<any>> {
    try {
      if (!sessionId) {
        throw new Error('缺少会话ID参数');
      }

      // 解析用户ID和章节ID（从会话ID）
      const parts = sessionId.split('_');
      if (parts.length < 4) {
        throw new Error('无效的会话ID格式');
      }

      const userId = parts[1];
      const sectionId = parts[2];

      // 创建助手实例来获取分析数据
      const assistant = await createLearningAssistant(userId, sectionId);
      const analytics = await assistant.getSessionAnalytics();
      await assistant.cleanup();

      return this.ok(analytics);

    } catch (error) {
      console.error('获取会话分析失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail("获取会话分析失败",errorMessage);
    }
  }
}
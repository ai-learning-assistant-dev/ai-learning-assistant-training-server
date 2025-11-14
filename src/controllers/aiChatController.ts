import { Request, Response } from 'express';
import { Route, Get, Post, Body, Path, Tags, Res, TsoaResponse, Query } from 'tsoa';
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
  ChatStreamlyResponse, 
  SessionInfo,
  UserSectionSessionsResponse
} from '../types/AiChat';
import { AnswerEvaluateRequest, AnswerEvaluateResponse } from '../types/AiChat';
import AnswerEvaluator from '../llm/domain/answer_evaluator';
import { Readable } from 'node:stream';
import { Section } from '../models/section';
import DailyChat from '../llm/domain/daily_chat';
import { getPromptWithArgs } from '../llm/prompt/manager';
import { KEY_AUDIO_COMMUNICATION_REQUIRE } from '../llm/prompt/default';
import { getAudioPromptByOption } from '../services/systemPromptService';

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

      // const realMessage = message.replace("[inner]", "");
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
   * DailyChat 流式对话接口（轻量一次性 agent）
   */
  @Post('/daily')
  public async chatDaily(
    @Body() request: StreamChatRequest
  ): Promise<Readable> {
    try {
      const { message } = request;

      if (!message) {
        throw new Error('缺少必要参数： message');
      }
      
      let requirements: string | undefined = undefined;
      if (request.useAudio && request.ttsOption) {
        const audioPrompts = await Promise.all(request.ttsOption.map(getAudioPromptByOption));
        requirements = audioPrompts.join('\n');
      }

      // 创建 DailyChat（短期有记忆的 SingleChat 封装，固定使用"信心十足的教育家"人设）
      const dc = await DailyChat.create({ requirements });

      // 获取 Readable 流
      const readable = dc.stream(message, { configurable: { thread_id: dc['sessionId'] } });

      // 当流结束或出错时，清理 DailyChat 资源
      readable.on('end', async () => {
        try {
          await dc.cleanup();
        } catch (e) {
          console.warn('DailyChat cleanup on end failed:', e);
        }
      });

      readable.on('close', async () => {
        try {
          await dc.cleanup();
        } catch (e) {
          console.warn('DailyChat cleanup on close failed:', e);
        }
      });

      readable.on('error', async (err) => {
        console.warn('DailyChat stream error:', err);
        try {
          await dc.cleanup();
        } catch (e) {
          console.warn('DailyChat cleanup on error failed:', e);
        }
      });

      return readable;

    } catch (error) {
      console.error('Daily 流式AI对话失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail('Daily 流式AI对话失败', errorMessage);
    }
  }

  /**
   * 使用大模型对学生简答题进行评估，返回评语与分数
   */
  @Post('/evaluate')
  public async evaluateAnswer(@Body() request: AnswerEvaluateRequest): Promise<ApiResponse<AnswerEvaluateResponse>> {
    try {
      const { studentAnswer, question, standardAnswer, priorKnowledge, prompt } = request;
      if (!studentAnswer || !question || !standardAnswer) {
        throw new Error('缺少必要参数：studentAnswer, question, standardAnswer');
      }

      const evaluator = new AnswerEvaluator();
      const result = await evaluator.evaluate(request);
      return this.ok(result);
    } catch (error) {
      console.error('答案评估失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail('答案评估失败', errorMessage);
    }
  }

  /**
   * 与AI助手进行流式对话
   */
  @Post('/chat/stream')
  public async chatStream(
    @Body() request: StreamChatRequest
  ): Promise<Readable> {
    try {
      if (request.daily) {
        return this.chatDaily(request);
      }

      let requirements: string | undefined = undefined;
      if (request.useAudio && request.ttsOption) {
        const audioPrompts = await Promise.all(request.ttsOption.map(getAudioPromptByOption));
        requirements = audioPrompts.join('\n');
      }

      const { userId, sectionId, message, personaId, sessionId } = request;

      // 验证必要参数
      if (!userId || !sectionId || !message) {
        throw new Error('缺少必要参数：userId, sectionId, message');
      }

      let assistant: LearningAssistant;

      try {
        if (sessionId) {
          // 恢复现有会话
          assistant = await resumeLearningSession(userId, sessionId, requirements);
        } else {
          // 创建新会话
          assistant = await createLearningAssistant(userId, sectionId, personaId,undefined,undefined, requirements);
        }

        // const realMessage = message.replace("[inner]", "");
        // 获取Readable流
        const readableStream = assistant.chatStream(message);

        // 清理资源
        await assistant.cleanup();

        return readableStream;

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
   * 通过用户ID和章节ID获取会话ID列表
   */
  @Get('/sessionID/by-user-section')
  public async getSessionsByUserAndSection(
    @Query() userId: string,
    @Query() sectionId: string
  ): Promise<ApiResponse<UserSectionSessionsResponse>> {
    try {
      if (!userId || !sectionId) {
        throw new Error('缺少必要参数：userId 和 sectionId');
      }

      // 通过 AiInteraction 表查询该用户在该章节的所有会话
      const aiInteractionRepo = AppDataSource.getRepository(AiInteraction);
      const interactions = await aiInteractionRepo.find({
        where: { 
          user_id: userId,
          section_id: sectionId 
        },
        order: { query_time: 'ASC' }
      });

      // 按 session_id 分组统计
      const sessionMap = new Map<string, {
        session_id: string;
        interactions: AiInteraction[];
      }>();

      interactions.forEach(interaction => {
        const sessionId = interaction.session_id;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            session_id: sessionId,
            interactions: []
          });
        }
        sessionMap.get(sessionId)!.interactions.push(interaction);
      });

      // 构建返回结果
      const sessions = Array.from(sessionMap.values()).map(session => ({
        session_id: session.session_id,
        interaction_count: session.interactions.length,
        first_interaction: session.interactions[0].query_time!,
        last_interaction: session.interactions[session.interactions.length - 1].query_time!
      }));

      // 按最后交互时间倒序排列
      sessions.sort((a, b) => b.last_interaction.getTime() - a.last_interaction.getTime());

      return this.ok({
        user_id: userId,
        section_id: sectionId,
        session_count: sessions.length,
        sessions: sessions
      });

    } catch (error) {
      console.error('获取用户章节会话列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail("获取用户章节会话列表失败", errorMessage);
    }
  }

  /**
   * 获取用户的学习会话列表
   */
  // @Get('/sessions/{userId}')
  // public async getUserSessions(
  //   @Path() userId: string
  // ): Promise<ApiResponse<any[]>> {
  //   try {
  //     if (!userId) {
  //       throw new Error('缺少用户ID参数');
  //     }

  //     // todo: 这块不太对，需要改一下
  //     // 创建临时助手实例来访问存储功能，使用一个有效的UUID格式
  //     const tempSectionId = '00000000-0000-0000-0000-000000000001';
  //     const assistant = await createLearningAssistant(userId, tempSectionId);
  //     const sessions = await assistant.getUserSectionSessions();
  //     await assistant.cleanup();

  //     return this.ok(sessions);

  //   } catch (error) {
  //     console.error('获取用户会话失败:', error);
  //     const errorMessage = error instanceof Error ? error.message : String(error);
  //     throw this.fail("获取用户会话失败",errorMessage);
  //   }
  // }



  /**
   * 获取会话的对话历史
   */
  @Get('/history/{sessionId}')
  public async getSessionHistory(
    @Path() sessionId: string,
    @Query() withoutInner?: boolean
  ): Promise<ApiResponse<{
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
      let history = interactions.map(interaction => ({
        interaction_id: interaction.interaction_id,
        user_message: interaction.user_message,
        ai_response: interaction.ai_response,
        query_time: interaction.query_time,
        user_name: interaction.user?.name,
        section_title: interaction.section?.title,
        persona_name: interaction.persona?.name
      }));

      // 如果请求中要求去除以 [inner] 开头的用户提问，则过滤掉这些记录
      if (withoutInner) {
        history = history.filter(item => {
          const um = item.user_message;
          if (!um) return true;
          return !String(um).trim().startsWith('[inner]');
        });
      }

      return this.ok({
        session_id: sessionId,
        message_count: history.length,
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

      if (!userId) {
        throw new Error('缺少必要参数：userId');
      }

      if (sectionId == "") {
        // 进入daily模式
        return this.ok({
          session_id: "12345672",
          user_id: userId,
          section_id: sectionId,
          persona_id: personaId,
          created_at: new Date()
        })
      }

      const assistant = await startNewLearningSession(userId, sectionId, personaId);
      const sessionId = assistant.getSessionId();
      await assistant.cleanup();

      console.log('创建新会话ID:', sessionId);
      console.log('用户ID:', userId);
      console.log('章节ID:', sectionId);
      console.log('人设ID:', personaId);

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

  /**
   * 获取当前课程所有人设列表
   */
  @Get('/personas')
  public async getPersonas(
    @Query() courseId?: string
  ): Promise<ApiResponse<any[]>> {
    try {
      const { AiPersona } = await import('../models/aiPersona');
      const personaRepo = AppDataSource.getRepository(AiPersona);
      
      // 如果指定了 courseId，可以根据课程筛选（目前返回所有）
      const personas = await personaRepo.find({
        select: ['persona_id', 'name', 'prompt', 'is_default_template'],
        order: { is_default_template: 'DESC' }
      });

      return this.ok(personas);
    } catch (error) {
      console.error('获取人设列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail('获取人设列表失败', errorMessage);
    }
  }

  /**
   * 切换当前会话的人设
   */
  @Post('/switch-persona')
  public async switchPersona(
    @Body() request: { sessionId: string; personaId: string }
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const { sessionId, personaId } = request;

      if (!sessionId || !personaId) {
        throw new Error('缺少必要参数：sessionId, personaId');
      }

      // 解析用户ID和章节ID（从会话ID）
      const parts = sessionId.split('_');
      if (parts.length < 4) {
        throw new Error('无效的会话ID格式');
      }

      const userId = parts[1];
      const sectionId = parts[2];

      // 恢复会话并切换人设
      const assistant = await resumeLearningSession(userId, sessionId);
      await assistant.switchPersona(personaId);
      await assistant.cleanup();

      return this.ok({
        success: true,
        message: `已成功切换到人设: ${personaId}`
      });

    } catch (error) {
      console.error('切换人设失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.fail('切换人设失败', errorMessage);
    }
  }
}
import { Request, Response } from 'express';
import { 
  createLearningAssistant, 
  startNewLearningSession,
  resumeLearningSession,
  LearningAssistant 
} from '../llm/domain/learning_assistant';
import { AppDataSource } from '../config/database';
import { AiInteraction } from '../models/aiInteraction';
import { User } from '../models/user';
import { Section } from '../models/section';

/**
 * 集成LLM Agent的AI交互控制器
 * 
 * 这个控制器将原有的AI交互功能与新的LLM Agent框架结合：
 * - 保持现有API的兼容性
 * - 增加LLM Agent的强大功能
 * - 支持会话管理和历史记录
 */

/**
 * 与AI助手进行对话（集成LLM Agent）
 * POST /api/ai-interactions/chat
 */
export async function chatWithAssistant(req: Request, res: Response): Promise<void> {
  try {
    const { userId, sectionId, message, personaId, sessionId } = req.body;

    // 验证必要参数
    if (!userId || !sectionId || !message) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数：userId, sectionId, message'
      });
      return;
    }

    let assistant: LearningAssistant;

    if (sessionId) {
      // 恢复现有会话
      assistant = await resumeLearningSession(userId, sessionId);
    } else {
      // 创建新会话
      assistant = await createLearningAssistant(userId, sectionId, personaId);
    }

    // 与AI进行对话
    const aiResponse = await assistant.chat(message);

    res.status(200).json({
      success: true,
      data: {
        interaction_id: `${assistant.getSessionId()}_${Date.now()}`, // 临时ID
        user_id: userId,
        section_id: sectionId,
        session_id: assistant.getSessionId(),
        user_message: message,
        ai_response: aiResponse,
        query_time: new Date(),
        persona_id_in_use: personaId
      }
    });

    // 清理资源
    await assistant.cleanup();

  } catch (error) {
    console.error('AI助手对话失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `AI助手对话失败: ${errorMessage}`
    });
  }
}

/**
 * 获取用户的学习会话列表
 * GET /api/ai-interactions/sessions/:userId
 */
export async function getUserSessions(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { sectionId } = req.query;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      });
      return;
    }

    // 创建临时助手实例来访问存储功能
    const assistant = await createLearningAssistant(userId, sectionId as string || 'temp');
    const sessions = await assistant.getUserSectionSessions();
    await assistant.cleanup();

    res.status(200).json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('获取用户会话失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `获取用户会话失败: ${errorMessage}`
    });
  }
}

/**
 * 获取会话的对话历史
 * GET /api/ai-interactions/history/:sessionId
 */
export async function getSessionHistory(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: '缺少会话ID参数'
      });
      return;
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

    res.status(200).json({
      success: true,
      data: {
        session_id: sessionId,
        message_count: interactions.length,
        history: history
      }
    });

  } catch (error) {
    console.error('获取会话历史失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `获取会话历史失败: ${errorMessage}`
    });
  }
}

/**
 * 获取会话分析统计
 * GET /api/ai-interactions/analytics/:sessionId
 */
export async function getSessionAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: '缺少会话ID参数'
      });
      return;
    }

    // 解析用户ID和章节ID（从会话ID）
    const parts = sessionId.split('_');
    if (parts.length < 4) {
      res.status(400).json({
        success: false,
        message: '无效的会话ID格式'
      });
      return;
    }

    const userId = parts[1];
    const sectionId = parts[2];

    // 创建助手实例来获取分析数据
    const assistant = await createLearningAssistant(userId, sectionId);
    const analytics = await assistant.getSessionAnalytics();
    await assistant.cleanup();

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('获取会话分析失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `获取会话分析失败: ${errorMessage}`
    });
  }
}

/**
 * 开始新的学习会话
 * POST /api/ai-interactions/sessions/new
 */
export async function startNewSession(req: Request, res: Response): Promise<void> {
  try {
    const { userId, sectionId, personaId } = req.body;

    if (!userId || !sectionId) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数：userId, sectionId'
      });
      return;
    }

    const assistant = await startNewLearningSession(userId, sectionId, personaId);
    const sessionId = assistant.getSessionId();
    await assistant.cleanup();

    res.status(201).json({
      success: true,
      data: {
        session_id: sessionId,
        user_id: userId,
        section_id: sectionId,
        persona_id: personaId,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('创建新会话失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `创建新会话失败: ${errorMessage}`
    });
  }
}

/**
 * 获取用户的学习进度和推荐（集成现有学习系统）
 * GET /api/ai-interactions/learning-progress/:userId
 */
export async function getUserLearningProgress(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      });
      return;
    }

    // 创建临时助手实例来获取学习进度
    const assistant = await createLearningAssistant(userId, 'temp');
    const progress = await assistant.getUserLearningProgress();
    await assistant.cleanup();

    res.status(200).json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('获取学习进度失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `获取学习进度失败: ${errorMessage}`
    });
  }
}

/**
 * 清理过期的AI交互记录
 * DELETE /api/ai-interactions/cleanup
 */
export async function cleanupExpiredSessions(req: Request, res: Response): Promise<void> {
  try {
    const { daysOld = 30 } = req.body;

    // 创建临时助手实例来执行清理
    const assistant = await createLearningAssistant('temp', 'temp');
    const deletedCount = await assistant['storage'].cleanupExpiredSessions(daysOld);
    await assistant.cleanup();

    res.status(200).json({
      success: true,
      data: {
        deleted_sessions: deletedCount,
        cleanup_date: new Date(),
        days_old_threshold: daysOld
      }
    });

  } catch (error) {
    console.error('清理过期会话失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `清理过期会话失败: ${errorMessage}`
    });
  }
}

// 导出所有控制器函数
export const enhancedAIController = {
  chatWithAssistant,
  getUserSessions,
  getSessionHistory,
  getSessionAnalytics,
  startNewSession,
  getUserLearningProgress,
  cleanupExpiredSessions
};
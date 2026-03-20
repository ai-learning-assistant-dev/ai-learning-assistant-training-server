import logger from '../../utils/logger';
import { eq, sql, min, max, count, lt } from 'drizzle-orm';
import { userDb } from '@db/index';
import { aiInteractions } from '@db/user/schema';

/** 会话映射信息 */
export interface SessionMapping {
  userId: string;
  sessionId: string;
  sectionId?: string;
  personaId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: unknown;
}

/** 对话分析信息 */
export interface ConversationAnalytics {
  sessionId: string;
  messageCount: number;
  firstMessageAt?: Date;
  lastMessageAt?: Date;
  userMessages: number;
  aiMessages: number;
  sessionDurationMinutes: number;
}

/**
 * 集成 Drizzle 的 LLM 存储管理器
 * 基于 AiInteraction 表实时查询会话数据，PGlite 进程内模式
 */
export class IntegratedStorage {
  /** 获取用户的所有会话（基于 AiInteraction 表聚合） */
  async getUserSessions(userId: string): Promise<SessionMapping[]> {
    try {
      const sessions = await userDb
        .select({
          userId: aiInteractions.user_id,
          sessionId: aiInteractions.session_id,
          sectionId: aiInteractions.section_id,
          personaId: aiInteractions.persona_id_in_use,
          createdAt: min(aiInteractions.query_time),
          updatedAt: max(aiInteractions.query_time),
        })
        .from(aiInteractions)
        .where(eq(aiInteractions.user_id, userId))
        .groupBy(aiInteractions.user_id, aiInteractions.session_id, aiInteractions.section_id, aiInteractions.persona_id_in_use)
        .orderBy(sql`max(${aiInteractions.query_time}) DESC`);

      return sessions.map(s => ({
        userId: s.userId,
        sessionId: s.sessionId,
        sectionId: s.sectionId ?? undefined,
        personaId: s.personaId ?? undefined,
        createdAt: s.createdAt ?? new Date(),
        updatedAt: s.updatedAt ?? new Date(),
      }));
    } catch (error) {
      logger.error(`[IntegratedStorage.getUserSessions] 查询用户会话失败, userId=${userId}:`, error);
      throw new Error(`获取用户会话失败 (userId=${userId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 获取会话的对话分析数据（基于 AiInteraction 表实时计算） */
  async getSessionAnalytics(sessionId: string): Promise<ConversationAnalytics | null> {
    try {
      const [analytics] = await userDb
        .select({
          sessionId: aiInteractions.session_id,
          messageCount: count(),
          firstMessageAt: min(aiInteractions.query_time),
          lastMessageAt: max(aiInteractions.query_time),
        })
        .from(aiInteractions)
        .where(eq(aiInteractions.session_id, sessionId))
        .groupBy(aiInteractions.session_id);

      if (!analytics) return null;

      const firstAt = analytics.firstMessageAt;
      const lastAt = analytics.lastMessageAt;
      const durationMinutes = firstAt && lastAt ? Math.round((lastAt.getTime() - firstAt.getTime()) / (1000 * 60)) : 0;

      return {
        sessionId: analytics.sessionId,
        messageCount: analytics.messageCount,
        firstMessageAt: firstAt ?? undefined,
        lastMessageAt: lastAt ?? undefined,
        userMessages: analytics.messageCount,
        aiMessages: analytics.messageCount,
        sessionDurationMinutes: durationMinutes,
      };
    } catch (error) {
      logger.error(`[IntegratedStorage.getSessionAnalytics] 查询会话分析失败, sessionId=${sessionId}:`, error);
      throw new Error(`获取会话分析失败 (sessionId=${sessionId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 清理过期的会话数据 */
  async cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await userDb.delete(aiInteractions).where(lt(aiInteractions.query_time, cutoffDate)).returning({ id: aiInteractions.interaction_id });

      return result.length;
    } catch (error) {
      logger.error(`[IntegratedStorage.cleanupExpiredSessions] 清理过期会话失败, daysOld=${daysOld}:`, error);
      throw new Error(`清理过期会话失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 根据用户ID和章节ID生成会话ID */
  static generateSessionId(userId: string, sectionId: string, timestamp?: Date): string {
    const time = timestamp ?? new Date();
    const dateStr = time.toISOString().split('T')[0]; // YYYY-MM-DD
    return `session_${userId}_${sectionId}_${dateStr}`;
  }

  /** 为用户在特定章节创建新的会话ID */
  createUserSectionSession(userId: string, sectionId: string): string {
    const sessionId = IntegratedStorage.generateSessionId(userId, sectionId);
    logger.debug(`📝 用户会话创建: ${userId} -> ${sessionId}`);
    return sessionId;
  }
}

// 全局集成存储实例（单例）
let globalStorage: IntegratedStorage | null = null;

export function getIntegratedStorage(): IntegratedStorage {
  if (!globalStorage) {
    globalStorage = new IntegratedStorage();
  }
  return globalStorage;
}

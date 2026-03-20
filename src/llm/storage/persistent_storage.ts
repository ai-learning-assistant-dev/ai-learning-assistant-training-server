import logger from '../../utils/logger';
import { eq, and, lt } from 'drizzle-orm';
import { userDb } from '@db/index';
import { userSessionMappings, conversationAnalytics } from '@db/user/schema';

/**
 * Drizzle 持久化存储管理器
 * PGlite 进程内模式，提供用户会话映射和对话分析的 CRUD 操作
 */
export class PersistentStorage {
  /** 映射用户ID到线程ID（存在则更新，不存在则插入） */
  async mapUserToThread(userId: string, threadId: string, metadata?: unknown): Promise<void> {
    try {
      const [existing] = await userDb
        .select()
        .from(userSessionMappings)
        .where(and(eq(userSessionMappings.user_id, userId), eq(userSessionMappings.thread_id, threadId)));

      if (existing) {
        await userDb
          .update(userSessionMappings)
          .set({ metadata, updated_at: new Date() })
          .where(and(eq(userSessionMappings.user_id, userId), eq(userSessionMappings.thread_id, threadId)));
      } else {
        await userDb.insert(userSessionMappings).values({
          user_id: userId,
          thread_id: threadId,
          metadata,
        });
      }
    } catch (error) {
      logger.error(`[PersistentStorage.mapUserToThread] 映射用户线程失败, userId=${userId}, threadId=${threadId}:`, error);
      throw new Error(`映射用户线程失败 (userId=${userId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 获取用户的所有会话线程 */
  async getUserThreads(userId: string): Promise<Array<{ threadId: string; createdAt: Date; updatedAt: Date; metadata?: unknown }>> {
    try {
      const records = await userDb.select().from(userSessionMappings).where(eq(userSessionMappings.user_id, userId)).orderBy(userSessionMappings.updated_at);

      return records.map(row => ({
        threadId: row.thread_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        metadata: row.metadata,
      }));
    } catch (error) {
      logger.error(`[PersistentStorage.getUserThreads] 查询用户线程失败, userId=${userId}:`, error);
      throw new Error(`查询用户线程失败 (userId=${userId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 更新对话分析数据（upsert） */
  async updateConversationAnalytics(sessionId: string, userId: string, conversationSummary: string, analyticsData: unknown): Promise<void> {
    try {
      const [existing] = await userDb
        .select()
        .from(conversationAnalytics)
        .where(and(eq(conversationAnalytics.session_id, sessionId), eq(conversationAnalytics.user_id, userId)));

      if (existing) {
        await userDb
          .update(conversationAnalytics)
          .set({
            conversation_summary: conversationSummary,
            analytics_data: analyticsData,
            updated_at: new Date(),
          })
          .where(and(eq(conversationAnalytics.session_id, sessionId), eq(conversationAnalytics.user_id, userId)));
      } else {
        await userDb.insert(conversationAnalytics).values({
          session_id: sessionId,
          user_id: userId,
          conversation_summary: conversationSummary,
          analytics_data: analyticsData,
        });
      }
    } catch (error) {
      logger.error(`[PersistentStorage.updateConversationAnalytics] 更新对话分析失败, sessionId=${sessionId}, userId=${userId}:`, error);
      throw new Error(`更新对话分析失败 (sessionId=${sessionId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 获取对话分析数据 */
  async getConversationAnalytics(sessionId: string, userId: string) {
    try {
      const [result] = await userDb
        .select()
        .from(conversationAnalytics)
        .where(and(eq(conversationAnalytics.session_id, sessionId), eq(conversationAnalytics.user_id, userId)));

      return result ?? null;
    } catch (error) {
      logger.error(`[PersistentStorage.getConversationAnalytics] 查询对话分析失败, sessionId=${sessionId}, userId=${userId}:`, error);
      throw new Error(`查询对话分析失败 (sessionId=${sessionId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** 清理过期的会话数据 */
  async cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const result = await userDb.delete(userSessionMappings).where(lt(userSessionMappings.updated_at, cutoff)).returning({ id: userSessionMappings.id });

      return result.length;
    } catch (error) {
      logger.error(`[PersistentStorage.cleanupExpiredSessions] 清理过期会话失败, daysOld=${daysOld}:`, error);
      throw new Error(`清理过期会话失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

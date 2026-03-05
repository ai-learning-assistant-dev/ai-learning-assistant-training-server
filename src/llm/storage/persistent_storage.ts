import { eq, and, lt } from 'drizzle-orm';
import { userDb } from '@db/index';
import { userSessionMappings, conversationAnalytics } from '@db/user/schema';

/**
 * Drizzle 持久化存储管理器
 *
 * PGlite 进程内模式，无需 connect/disconnect 生命周期。
 * 提供用户会话映射和对话分析的 CRUD 操作。
 */
export class PersistentStorage {
  /**
   * 映射用户ID到线程ID
   */
  async mapUserToThread(userId: string, threadId: string, metadata?: unknown): Promise<void> {
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
  }

  /**
   * 获取用户的所有会话线程
   */
  async getUserThreads(userId: string): Promise<Array<{ threadId: string; createdAt: Date; updatedAt: Date; metadata?: unknown }>> {
    const records = await userDb.select().from(userSessionMappings).where(eq(userSessionMappings.user_id, userId)).orderBy(userSessionMappings.updated_at);

    return records.map(row => ({
      threadId: row.thread_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata,
    }));
  }

  /**
   * 更新对话分析数据
   */
  async updateConversationAnalytics(sessionId: string, userId: string, conversationSummary: string, analyticsData: unknown): Promise<void> {
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
  }

  /**
   * 获取对话分析数据
   */
  async getConversationAnalytics(sessionId: string, userId: string) {
    const [result] = await userDb
      .select()
      .from(conversationAnalytics)
      .where(and(eq(conversationAnalytics.session_id, sessionId), eq(conversationAnalytics.user_id, userId)));

    return result ?? null;
  }

  /**
   * 清理过期的会话数据
   */
  async cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await userDb.delete(userSessionMappings).where(lt(userSessionMappings.updated_at, cutoff)).returning({ id: userSessionMappings.id });

    return result.length;
  }
}

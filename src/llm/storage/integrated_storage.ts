import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool, PoolConfig } from "pg";
import { llmPort, MainDataSource, UserDataSource } from "../../config/database";
import { AiInteraction } from "../../models/aiInteraction";
// 其余实体（User/Section/AiPersona）暂未在此类中直接使用，后续若需要跨库查询可引用 MainDataSource/UserDataSource 获取。

/**
 * 会话映射信息接口
 */
export interface SessionMapping {
  userId: string;
  sessionId: string;
  sectionId?: string;
  personaId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

/**
 * 对话分析信息接口
 */
export interface ConversationAnalytics {
  sessionId: string;
  messageCount: number;
  firstMessageAt?: Date;
  lastMessageAt?: Date;
  userMessages: number;
  aiMessages: number;
  sessionDurationMinutes: number;
}

let iPSS: IntegratedPostgreSQLStorage | null = null;

export function getSingleIPSS(){
  if(iPSS){
    return iPSS;
  }else{
    iPSS = new IntegratedPostgreSQLStorage({
      host: 'localhost',
      port: llmPort,
      database: 'ai_learning_assistant_llm',
      max: 1,
      min: 1,
      keepAlive: true,
    });
    return iPSS;
  }
  
}
/**
 * 集成现有数据模型的 PostgreSQL 持久化存储管理器
 */
export class IntegratedPostgreSQLStorage {
  private pool: Pool;
  private saver: PostgresSaver | null = null;
  private connected = false;

  constructor(private config: PoolConfig) {
    this.pool = new Pool(config);
  }

  /**
   * 连接到 PostgreSQL 数据库并初始化 checkpoint saver
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 测试连接
      const testClient = await this.pool.connect();
      console.log(`📦 LLM Storage 已连接到 PostgreSQL: ${this.config.host}:${this.config.port}/${this.config.database}`);
      testClient.release();
      
      // 创建 PostgresSaver 实例

      this.saver = new PostgresSaver(this.pool);
      // this.saver = PostgresSaver.fromConnString(`postgresql://localhost:${llmPort}/ai_learning_assistant_llm`);
      
      // 让 PostgresSaver 设置其需要的表
      await this.saver.setup();
      console.log("✅ LangGraph checkpoint 表结构已设置");
      
      this.connected = true;
      console.log("✅ 集成的 PostgreSQL LLM storage 初始化完成");
    } catch (error) {
      console.error("❌ LLM PostgreSQL 连接失败:", error);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.pool.end();
      // this.saver?.end();
      this.connected = false;
      this.saver = null;
      console.log("📦 已断开 LLM PostgreSQL 连接");
    } catch (error) {
      console.error("❌ 断开 LLM PostgreSQL 连接时出错:", error);
      throw error;
    }
  }

  /**
   * 获取 PostgresSaver 实例
   */
  getSaver(): PostgresSaver {
    if (!this.saver || !this.connected) {
      throw new Error("LLM PostgreSQL 未连接，请先调用 connect() 方法");
    }
    return this.saver;
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 映射用户ID到会话ID（使用现有的 AiInteraction 表）
   */
  async mapUserToSession(
    userId: string, 
    sessionId: string, 
    sectionId?: string,
    personaId?: string,
    metadata?: any
  ): Promise<void> {
    if (!this.connected) {
      throw new Error("PostgreSQL 未连接");
    }

    // 这里我们不需要创建新的映射表，因为 AiInteraction 已经包含了这些信息
    // 我们可以通过查询 AiInteraction 表来获取用户的会话映射
    console.log(`📝 用户会话映射记录: ${userId} -> ${sessionId}`);
  }

  /**
   * 获取用户的所有会话（基于 AiInteraction 表）
   */
  async getUserSessions(userId: string): Promise<SessionMapping[]> {
    if (!UserDataSource.isInitialized) {
      throw new Error("UserDataSource 未初始化");
    }

    const aiInteractionRepo = UserDataSource.getRepository(AiInteraction);
    
    // 获取用户的所有不同会话
    const sessions = await aiInteractionRepo
      .createQueryBuilder("ai")
      .select([
        "ai.user_id as userId",
        "ai.session_id as sessionId", 
        "ai.section_id as sectionId",
        "ai.persona_id_in_use as personaId",
        "MIN(ai.query_time) as createdAt",
        "MAX(ai.query_time) as updatedAt"
      ])
      .where("ai.user_id = :userId", { userId })
      .groupBy("ai.user_id, ai.session_id, ai.section_id, ai.persona_id_in_use")
      .orderBy("updatedAt", "DESC")
      .getRawMany();

    return sessions.map((session: any) => ({
      userId: session.userid,
      sessionId: session.sessionid,
      sectionId: session.sectionid,
      personaId: session.personaid,
      createdAt: session.createdat,
      updatedAt: session.updatedat,
      metadata: null
    }));
  }

  /**
   * 获取会话的对话分析数据（基于 AiInteraction 表）
   */
  async getSessionAnalytics(sessionId: string): Promise<ConversationAnalytics | null> {
      if (!UserDataSource.isInitialized) {
        throw new Error("UserDataSource 未初始化");
      }

      const aiInteractionRepo = UserDataSource.getRepository(AiInteraction);
    
    const analytics = await aiInteractionRepo
      .createQueryBuilder("ai")
      .select([
        "ai.session_id as sessionId",
        "COUNT(*) as messageCount",
        "MIN(ai.query_time) as firstMessageAt",
        "MAX(ai.query_time) as lastMessageAt",
        "COUNT(*) as userMessages", // 每个 AiInteraction 代表一轮对话（用户消息+AI响应）
        "COUNT(*) as aiMessages"    // 所以用户消息数和AI消息数相等
      ])
      .where("ai.session_id = :sessionId", { sessionId })
      .groupBy("ai.session_id")
      .getRawOne();

    if (!analytics) {
      return null;
    }

    const firstMessageAt = analytics.firstmessageat;
    const lastMessageAt = analytics.lastmessageat;
    const sessionDurationMinutes = firstMessageAt && lastMessageAt 
      ? Math.round((lastMessageAt.getTime() - firstMessageAt.getTime()) / (1000 * 60))
      : 0;

    return {
      sessionId: analytics.sessionid,
      messageCount: parseInt(analytics.messagecount),
      firstMessageAt: analytics.firstmessageat,
      lastMessageAt: analytics.lastmessageat,
      userMessages: parseInt(analytics.usermessages),
      aiMessages: parseInt(analytics.aimessages),
      sessionDurationMinutes
    };
  }

  /**
   * 更新对话分析数据（这个方法主要用于兼容 LLM 框架的接口）
   */
  async updateConversationAnalytics(
    sessionId: string, 
    messageCount: number,
    userMessageCount: number,
    aiMessageCount: number,
    totalTokens?: number
  ): Promise<void> {
    // 由于我们使用现有的 AiInteraction 表，这里不需要额外的更新逻辑
    // 分析数据会通过 getSessionAnalytics 实时计算
    console.log(`📊 会话分析更新: ${sessionId} (${messageCount} 条消息)`);
  }

  /**
   * 清理过期的会话数据（基于 AiInteraction 表）
   */
  async cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
      if (!UserDataSource.isInitialized) {
        throw new Error("UserDataSource 未初始化");
      }

      const aiInteractionRepo = UserDataSource.getRepository(AiInteraction);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await aiInteractionRepo
      .createQueryBuilder()
      .delete()
      .where("query_time < :cutoffDate", { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * 获取数据库连接池实例（用于高级操作）
   */
  getPool(): Pool {
    if (!this.connected) {
      throw new Error("PostgreSQL 未连接");
    }
    return this.pool;
  }

  /**
   * 根据用户ID和章节ID生成会话ID
   */
  static generateSessionId(userId: string, sectionId: string, timestamp?: Date): string {
    const time = timestamp || new Date();
    const dateStr = time.toISOString().split('T')[0]; // YYYY-MM-DD
    return `session_${userId}_${sectionId}_${dateStr}`;
  }

  /**
   * 为用户在特定章节创建新的会话
   */
  async createUserSectionSession(
    userId: string, 
    sectionId: string, 
    personaId?: string
  ): Promise<string> {
    const sessionId = IntegratedPostgreSQLStorage.generateSessionId(userId, sectionId);
    
    // 会话映射会在第一次 AiInteraction 记录创建时自动建立
    await this.mapUserToSession(userId, sessionId, sectionId, personaId);
    
    return sessionId;
  }
}

/**
 * 创建基于现有数据库配置的集成存储配置
 */
export function createIntegratedPostgreSQLConfig(): PoolConfig {
  return {
    host: "localhost",
    port: llmPort,
    database: "ai_learning_assistant_llm",
    user: process.env.DB_USERNAME || process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    ssl: false,
  };
}

/**
 * 全局集成存储实例
 */
let globalIntegratedStorage: IntegratedPostgreSQLStorage | null = null;

/**
 * 获取或创建全局集成存储实例
 */
export function getIntegratedStorage(config?: PoolConfig): IntegratedPostgreSQLStorage {
  if (!globalIntegratedStorage) {
    const finalConfig = config || createIntegratedPostgreSQLConfig();
    globalIntegratedStorage = getSingleIPSS();
  }
  return globalIntegratedStorage;
}

/**
 * 重置全局集成存储实例
 */
export function resetIntegratedStorage(): void {
  globalIntegratedStorage = null;
}
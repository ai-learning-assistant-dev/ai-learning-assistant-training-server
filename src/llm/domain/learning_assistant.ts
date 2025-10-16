import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { AppDataSource } from "../../config/database";
import { AiInteraction } from "../../models/aiInteraction";
import { User } from "../../models/user";
import { Section } from "../../models/section";
import { AiPersona } from "../../models/aiPersona";
import { ReactAgent } from "../agent/react_agent_base";
import { IntegratedPostgreSQLStorage } from "../storage/integrated_storage";
import { createLLM } from "../utils/create_llm";

/**
 * 学习助手配置选项
 */
export interface LearningAssistantOptions {
  /** 用户ID */
  userId: string;
  /** 章节ID */
  sectionId: string;
  /** AI人设ID（可选，使用默认人设） */
  personaId?: string;
  /** 自定义会话ID（可选，系统自动生成） */
  sessionId?: string;
  /** 自定义存储实例（可选） */
  storage?: IntegratedPostgreSQLStorage;
}

/**
 * 集成现有数据模型的学习助手
 * 
 * 这个类将 LangGraph ReactAgent 与现有的数据模型无缝集成：
 * - 使用现有的 AiInteraction 表记录对话
 * - 支持用户、章节、AI人设的关联
 * - 提供会话管理和历史记录功能
 */
export class LearningAssistant {
  private agent: ReactAgent;
  private storage: IntegratedPostgreSQLStorage;
  private userId: string;
  private sectionId: string;
  private sessionId: string;
  private personaId?: string;

  constructor(options: LearningAssistantOptions) {
    this.userId = options.userId;
    this.sectionId = options.sectionId;
    this.personaId = options.personaId;
    this.sessionId = options.sessionId || IntegratedPostgreSQLStorage.generateSessionId(
      this.userId, 
      this.sectionId
    );
    
    // 使用集成存储
    this.storage = options.storage || new IntegratedPostgreSQLStorage({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "ai_learning_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
    });

    // ReactAgent 将在 initialize() 方法中创建
    this.agent = null as any; // 临时设置，将在 initialize 中正确创建
  }

  /**
   * 初始化助手（连接数据库、验证用户等）
   */
  async initialize(): Promise<void> {
    // 确保数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // 连接 LLM 存储
    if (!this.storage.isConnected()) {
      await this.storage.connect();
    }

    // 创建 ReactAgent（现在存储已经连接）
    this.agent = new ReactAgent({
      llm: createLLM(),
      defaultThreadId: this.sessionId,
      checkpointSaver: this.storage.getSaver(),
      postgresStorage: this.storage as any,
    });

    // 验证用户、章节、人设是否存在
    await this.validateEntities();

    console.log(`🤖 学习助手已初始化 - 用户: ${this.userId}, 章节: ${this.sectionId}, 会话: ${this.sessionId}`);
  }

  /**
   * 与AI进行对话
   */
  async chat(userMessage: string): Promise<string> {
    try {
      // 使用 ReactAgent 处理对话
      const aiResponse = await this.agent.chat(userMessage, {
        configurable: { thread_id: this.sessionId }
      });

      // 保存对话记录到现有的 AiInteraction 表
      await this.saveInteraction(userMessage, aiResponse);

      return aiResponse;
    } catch (error) {
      console.error("💬 对话处理失败:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`对话处理失败: ${errorMessage}`);
    }
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(): Promise<BaseMessage[]> {
    return this.agent.getConversationHistory(this.sessionId);
  }

  /**
   * 获取用户在当前章节的所有会话
   */
  async getUserSectionSessions(): Promise<any[]> {
    const allSessions = await this.storage.getUserSessions(this.userId);
    return allSessions.filter(session => session.sectionId === this.sectionId);
  }

  /**
   * 获取当前会话的统计分析
   */
  async getSessionAnalytics(): Promise<any> {
    return this.storage.getSessionAnalytics(this.sessionId);
  }

  /**
   * 切换到不同的AI人设
   */
  async switchPersona(newPersonaId: string): Promise<void> {
    // 验证新人设是否存在
    const personaRepo = AppDataSource.getRepository(AiPersona);
    const persona = await personaRepo.findOne({ where: { persona_id: newPersonaId } });
    
    if (!persona) {
      throw new Error(`AI人设不存在: ${newPersonaId}`);
    }

    this.personaId = newPersonaId;
    
    // 可以考虑创建新的会话或在当前会话中标记人设切换
    console.log(`🎭 已切换到AI人设: ${persona.name}`);
  }

  /**
   * 获取用户的学习记录和进度（集成现有的学习系统）
   */
  async getUserLearningProgress(): Promise<any> {
    if (!AppDataSource.isInitialized) {
      throw new Error("TypeORM DataSource 未初始化");
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { user_id: this.userId },
      relations: ['learningRecords', 'courseSchedules']
    });

    return {
      user: user,
      learningRecords: user?.learningRecords || [],
      courseSchedules: user?.courseSchedules || []
    };
  }

  /**
   * 清理助手资源
   */
  async cleanup(): Promise<void> {
    if (this.storage.isConnected()) {
      await this.storage.disconnect();
    }
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取用户ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * 获取章节ID
   */
  getSectionId(): string {
    return this.sectionId;
  }

  /**
   * 验证用户、章节、人设实体是否存在
   */
  private async validateEntities(): Promise<void> {
    if (!AppDataSource.isInitialized) {
      throw new Error("TypeORM DataSource 未初始化");
    }

    // 验证用户
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { user_id: this.userId } });
    if (!user) {
      throw new Error(`用户不存在: ${this.userId}`);
    }

    // 验证章节（跳过演示用的虚拟章节）
    const isDemoSection = this.sectionId === "00000000-0000-0000-0000-000000000001";
    if (!isDemoSection) {
      const sectionRepo = AppDataSource.getRepository(Section);
      const section = await sectionRepo.findOne({ where: { section_id: this.sectionId } });
      if (!section) {
        throw new Error(`章节不存在: ${this.sectionId}`);
      }
    } else {
      console.log("⚠️ 跳过演示用虚拟章节的验证");
    }

    // 验证AI人设（如果指定了）
    if (this.personaId) {
      const personaRepo = AppDataSource.getRepository(AiPersona);
      const persona = await personaRepo.findOne({ where: { persona_id: this.personaId } });
      if (!persona) {
        throw new Error(`AI人设不存在: ${this.personaId}`);
      }
    }
  }

  /**
   * 保存对话记录到现有的 AiInteraction 表
   */
  private async saveInteraction(userMessage: string, aiResponse: string): Promise<void> {
    if (!AppDataSource.isInitialized) {
      throw new Error("TypeORM DataSource 未初始化");
    }

    const aiInteractionRepo = AppDataSource.getRepository(AiInteraction);
    
    const interaction = new AiInteraction();
    interaction.user_id = this.userId;
    interaction.section_id = this.sectionId;
    interaction.session_id = this.sessionId;
    interaction.user_message = userMessage;
    interaction.ai_response = aiResponse;
    interaction.query_time = new Date();
    interaction.persona_id_in_use = this.personaId;

    await aiInteractionRepo.save(interaction);
    
    console.log(`💾 对话记录已保存: ${interaction.interaction_id}`);
  }
}

/**
 * 创建学习助手的工厂函数
 */
export async function createLearningAssistant(
  userId: string,
  sectionId: string,
  personaId?: string,
  sessionId?: string
): Promise<LearningAssistant> {
  const assistant = new LearningAssistant({
    userId,
    sectionId,
    personaId,
    sessionId
  });
  
  await assistant.initialize();
  return assistant;
}

/**
 * 为用户在特定章节创建新的学习会话
 */
export async function startNewLearningSession(
  userId: string,
  sectionId: string,
  personaId?: string
): Promise<LearningAssistant> {
  // 生成新的会话ID
  const sessionId = IntegratedPostgreSQLStorage.generateSessionId(userId, sectionId);
  
  return createLearningAssistant(userId, sectionId, personaId, sessionId);
}

/**
 * 恢复现有的学习会话
 */
export async function resumeLearningSession(
  userId: string,
  sessionId: string
): Promise<LearningAssistant> {
  // 从会话ID中解析章节ID（假设使用标准格式）
  const parts = sessionId.split('_');
  if (parts.length < 4) {
    throw new Error(`无效的会话ID格式: ${sessionId}`);
  }
  
  const sectionId = parts[2]; // session_{userId}_{sectionId}_{date} 格式
  
  return createLearningAssistant(userId, sectionId, undefined, sessionId);
}
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { AppDataSource } from "../../config/database";
import { AiInteraction } from "../../models/aiInteraction";
import { User } from "../../models/user";
import { Section } from "../../models/section";
import { AiPersona } from "../../models/aiPersona";
import { Course } from "../../models/course";
import { Chapter } from "../../models/chapter";
import { ReactAgent } from "../agent/react_agent_base";
import { IntegratedPostgreSQLStorage } from "../storage/integrated_storage";
import { createLLM } from "../utils/create_llm";

/**
 * 学习助手配置选项
 */
export interface LearningAssistantOptions {
  /** 用户ID */
  userId: string;
  /** 课程ID（可选，如果提供会自动加载课程信息） */
  courseId?: string;
  /** 章节ID */
  sectionId: string;
  /** AI人设ID（可选，使用默认人设或课程默认人设） */
  personaId?: string;
  /** 自定义会话ID（可选，系统自动生成） */
  sessionId?: string;
  /** 自定义存储实例（可选） */
  storage?: IntegratedPostgreSQLStorage;
}

/**
 * 集成现有数据模型的学习助手
 * 
 * - 使用现有的 AiInteraction 表记录对话
 * - 支持用户、章节、AI人设的关联
 * - 提供会话管理和历史记录功能
 */
export class LearningAssistant {
  private agent: ReactAgent;
  private storage: IntegratedPostgreSQLStorage;
  private userId: string;
  private courseId?: string;
  private sectionId: string;
  private sessionId: string;
  private personaId?: string;

  constructor(options: LearningAssistantOptions) {
    this.userId = options.userId;
    this.courseId = options.courseId;
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

    // 加载课程信息并设置默认人设（如果需要）
    await this.loadCourseInfo();

    // 生成包含课程上下文的系统提示
    const systemPrompt = await this.createSystemPrompt();

    // 创建 ReactAgent（现在存储已经连接）
    this.agent = new ReactAgent({
      llm: createLLM(),
      defaultThreadId: this.sessionId,
      checkpointSaver: this.storage.getSaver(),
      postgresStorage: this.storage as any,
      prompt: systemPrompt,
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
   * 与AI进行流式对话
   * @param userMessage 用户消息
   * @returns AsyncGenerator 流式返回AI响应
   */
  async* chatStream(userMessage: string): AsyncGenerator<string, void, unknown> {
    try {
      console.log("🔄 开始流式对话处理...");
      
      // 获取当前对话历史
      const existingMessages = await this.agent.getConversationHistory(this.sessionId);

      // 添加新的用户消息
      const { HumanMessage } = await import("@langchain/core/messages");
      const allMessages = [...existingMessages, new HumanMessage(userMessage)];
      
      // 使用ReactAgent的stream方法进行流式处理
      const streamPromise = this.agent.stream(allMessages, {
        configurable: { thread_id: this.sessionId },
        streamMode: "messages" // 尝试使用messages模式而不是updates
      });

      // 等待stream返回并处理
      const stream = await streamPromise;
      let fullResponse = "";
      let messageCount = 0;
      
      // 处理流式输出
      for await (const chunk of stream) {
        messageCount++;
        
        try {
          let content = '';
          
          // 基于最新调试结果：chunk是数组格式，第一个对象包含content字段
          if (Array.isArray(chunk) && chunk.length > 0) {
            const messageObj = chunk[0];
            if (messageObj && typeof messageObj.content === 'string') {
              content = messageObj.content;
            }
          }
          
          if (content) {
            fullResponse += content;
            yield content;
          } else {
            // 只在前几个chunk显示无内容警告
            if (messageCount <= 10) {
              console.log(`Chunk ${messageCount}: 无内容`);
            }
          }
        } catch (chunkError) {
          console.warn(`Chunk ${messageCount} 处理错误:`, chunkError);
          continue;
        }
      }
      // 如果流式处理产生了结果，保存到数据库
      if (fullResponse) {
        await this.saveInteraction(userMessage, fullResponse);
      } else {
        // 如果流式处理没有产生结果，回退到普通chat
        console.warn("流式处理未产生结果，回退到普通模式");
        const response = await this.chat(userMessage);
        yield response;
      }

    } catch (error) {
      console.error("流式对话处理失败:", error);
      // 回退到普通chat模式
      try {
        console.log("回退到普通聊天模式...");
        const response = await this.chat(userMessage);
        yield response;
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new Error(`流式对话处理失败: ${errorMessage}`);
      }
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
   * 获取课程信息
   */
  async getCourseInfo(): Promise<any> {
    if (!this.courseId || !AppDataSource.isInitialized) {
      return null;
    }

    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({
      where: { course_id: this.courseId },
      relations: ['chapters', 'defaultAiPersona', 'titles', 'tests']
    });

    return course;
  }

  /**
   * 获取课程大纲（章节结构）
   */
  async getCourseOutline(): Promise<string> {
    if (!this.courseId) {
      return "当前会话未关联课程信息";
    }

    const course = await this.getCourseInfo();
    if (!course) {
      return "课程信息不存在";
    }

    let outline = `📚 ${course.name}\n`;
    if (course.description) {
      outline += `📝 课程描述: ${course.description}\n\n`;
    }

    // 加载完整的章节和小节信息
    const chapterRepo = AppDataSource.getRepository(Chapter);
    const chapters = await chapterRepo.find({
      where: { course_id: this.courseId },
      order: { chapter_order: 'ASC' }
    });

    if (chapters.length === 0) {
      outline += "暂无章节内容";
      return outline;
    }

    // 获取所有章节的小节
    const sectionRepo = AppDataSource.getRepository(Section);
    
    outline += "📋 课程大纲:\n";
    
    for (let index = 0; index < chapters.length; index++) {
      const chapter = chapters[index];
      outline += `${index + 1}. ${chapter.title}\n`;
      
      // 查询该章节下的所有小节
      const sections = await sectionRepo.find({
        where: { chapter_id: chapter.chapter_id },
        order: { section_order: 'ASC' }
      });
      
      if (sections.length > 0) {
        sections.forEach((section, sectionIndex) => {
          outline += `   ${index + 1}.${sectionIndex + 1} ${section.title}`;
          if (section.estimated_time) {
            outline += ` (${section.estimated_time}分钟)`;
          }
          outline += "\n";
        });
      }
    }

    return outline;
  }

  /**
   * 获取当前章节在课程中的上下文信息
   */
  async getSectionContext(): Promise<string> {
    if (!AppDataSource.isInitialized) {
      return "数据库未初始化";
    }

    const sectionRepo = AppDataSource.getRepository(Section);
    const section = await sectionRepo.findOne({
      where: { section_id: this.sectionId },
      relations: ['chapter', 'chapter.course']
    });

    if (!section) {
      return "章节信息不存在";
    }

    let context = `📖 当前章节: ${section.title}\n`;
    
    if (section.chapter) {
      context += `📚 所属章节: ${section.chapter.title}\n`;
      
      if (section.chapter.course) {
        context += `🎓 所属课程: ${section.chapter.course.name}\n`;
        // 更新课程ID
        this.courseId = section.chapter.course.course_id;
      }
    }

    if (section.knowledge_points) {
      context += `🎯 知识点: ${section.knowledge_points}\n`;
    }

    if (section.knowledge_content) {
      context += `📋 内容概要: ${section.knowledge_content}\n`;
    }

    if (section.estimated_time) {
      context += `⏱️ 预计时间: ${section.estimated_time}分钟\n`;
    }

    return context;
  }

  /**
   * 加载课程信息并设置默认AI人设
   */
  private async loadCourseInfo(): Promise<void> {
    if (!AppDataSource.isInitialized) {
      return;
    }

    // 如果没有提供课程ID，尝试从章节信息中获取
    if (!this.courseId) {
      const sectionContext = await this.getSectionContext();
      console.log("📖 从章节加载课程上下文:", sectionContext.split('\n')[0]);
    }

    // 如果仍然没有课程ID，直接返回
    if (!this.courseId) {
      return;
    }

    const course = await this.getCourseInfo();
    if (!course) {
      console.log("⚠️ 课程信息加载失败:", this.courseId);
      return;
    }

    console.log(`📚 已加载课程: ${course.name}`);

    // 如果没有指定AI人设，使用课程的默认人设
    if (!this.personaId && course.default_ai_persona_id) {
      this.personaId = course.default_ai_persona_id;
      console.log(`🎭 使用课程默认AI人设: ${course.defaultAiPersona?.name || this.personaId}`);
    }
  }

  /**
   * 创建包含课程上下文的系统提示
   */
  private async createSystemPrompt(): Promise<any> {
    let systemPromptText = "";
    let personaPrompt = "你是一个智能学习助手，专门帮助学生学习和答疑。请根据学生的问题提供准确、有用的学习指导.";

    // 获取AI人设的提示
    if (this.personaId && AppDataSource.isInitialized) {
      const personaRepo = AppDataSource.getRepository(AiPersona);
      const persona = await personaRepo.findOne({ where: { persona_id: this.personaId } });
      personaPrompt = persona ? persona.prompt : personaPrompt;}

    // 添加课程上下文信息
    if (this.courseId) {
      const courseOutline = await this.getCourseOutline();
      const sectionContext = await this.getSectionContext();
      
      systemPromptText += `## 当前学习环境

${sectionContext}

## 完整课程信息

${courseOutline}

## 角色

${personaPrompt}`;
    } else {
      // 如果没有课程信息，提供通用的学习助手提示
      systemPromptText += `## 🤖 AI学习助手

你是一个智能学习助手，专门帮助学生学习和答疑。请根据学生的问题提供准确、有用的学习指导。`;
    }

    // 使用 SystemMessage 格式
    const { SystemMessage } = await import("@langchain/core/messages");
    return new SystemMessage(systemPromptText);
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
   * 获取课程ID
   */
  getCourseId(): string | undefined {
    return this.courseId;
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
  sessionId?: string,
  courseId?: string
): Promise<LearningAssistant> {
  const assistant = new LearningAssistant({
    userId,
    courseId,
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
  personaId?: string,
  courseId?: string
): Promise<LearningAssistant> {
  // 生成新的会话ID
  const sessionId = IntegratedPostgreSQLStorage.generateSessionId(userId, sectionId);
  
  return createLearningAssistant(userId, sectionId, personaId, sessionId, courseId);
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

/**
 * 基于课程创建学习助手
 */
export async function createCourseAssistant(
  userId: string,
  courseId: string,
  sectionId?: string
): Promise<LearningAssistant> {
  // 如果没有指定章节，使用第一个章节
  let finalSectionId = sectionId;
  
  if (!finalSectionId && AppDataSource.isInitialized) {
    const chapterRepo = AppDataSource.getRepository(Chapter);
    const firstChapter = await chapterRepo.findOne({
      where: { course_id: courseId },
      order: { chapter_order: 'ASC' }
    });
    
    if (firstChapter) {
      const sectionRepo = AppDataSource.getRepository(Section);
      const firstSection = await sectionRepo.findOne({
        where: { chapter_id: firstChapter.chapter_id },
        order: { section_order: 'ASC' }
      });
      
      if (firstSection) {
        finalSectionId = firstSection.section_id;
        console.log(`📖 自动选择课程第一个章节: ${firstSection.title}`);
      }
    }
  }
  
  if (!finalSectionId) {
    throw new Error("无法确定课程的章节信息，请指定 sectionId");
  }
  
  return createLearningAssistant(userId, finalSectionId, undefined, undefined, courseId);
}
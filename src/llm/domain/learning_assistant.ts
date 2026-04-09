import logger from '../../utils/logger';
import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Readable } from 'stream';
import { MemorySaver } from '@langchain/langgraph';
import { eq, asc, and, desc, isNotNull } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { courses, chapters, sections, aiPersonas } from '@db/main/schema';
import { users, aiInteractions, learningRecords, courseSchedules } from '@db/user/schema';
import { ReactAgent } from '../agent/react_agent_base';
import { IntegratedStorage } from '../storage/integrated_storage';
import { createLLM } from '../utils/create_llm';
import { createSrtTools } from '../tool/srt_tools';
import type { SRTItem } from '../tool/types';
import { getPromptWithArgs } from '../prompt/manager';
import { KEY_LEARNING_ASSISTANT, KEY_LEARNING_ASSISTANT_FALLBACK } from '../prompt/default';
import { type ModelConfig, modelConfigManager } from '../utils/modelConfigManager';

/** 学习助手配置选项 */
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
  storage?: IntegratedStorage;
  /** 附加在系统提示词中的额外要求 */
  requirements?: string;
  /** 选择的llm模型配置（可选） */
  modelName?: string;
  /** 是否启用推理模式（可选） */
  reasoning?: boolean;
}

const normalizePersonaId = (id?: string): string | undefined => {
  if (!id) return undefined;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * 集成 Drizzle 的学习助手
 * 使用 AiInteraction 记录对话，MemorySaver 管理会话内记忆，支持用户/章节/AI人设关联
 */
export class LearningAssistant {
  private agent!: ReactAgent;
  private storage: IntegratedStorage;
  private userId: string;
  private courseId?: string;
  private sectionId: string;
  private sessionId: string;
  private personaId?: string;
  private requirements?: string;
  private selectedModelConfig?: ModelConfig;

  constructor(options: LearningAssistantOptions) {
    this.userId = options.userId;
    this.courseId = options.courseId;
    this.sectionId = options.sectionId;
    this.personaId = normalizePersonaId(options.personaId);
    this.sessionId = options.sessionId || IntegratedStorage.generateSessionId(this.userId, this.sectionId);
    this.requirements = options.requirements;
    this.selectedModelConfig = options.modelName ? modelConfigManager.getModelConfig(options.modelName) : modelConfigManager.getDefaultModel();
    if (this.selectedModelConfig && options.reasoning !== undefined) {
      this.selectedModelConfig.reasoning = options.reasoning;
    }

    this.storage = options.storage ?? new IntegratedStorage();
  }

  /** 初始化助手：加载课程信息、设置系统提示词、创建 ReactAgent、验证实体 */
  async initialize(): Promise<void> {
    // 加载课程信息并设置默认人设
    await this.loadCourseInfo();

    // 生成包含课程上下文的系统提示
    const systemPrompt = await this.createSystemPrompt();

    // 尝试加载 SRT 工具
    let tools: unknown[] | undefined = undefined;
    try {
      const [section] = await mainDb.select().from(sections).where(eq(sections.section_id, this.sectionId));

      const videoSubtitles = section?.video_subtitles;
      if (videoSubtitles) {
        try {
          const subtitlesSource: string | SRTItem[] = Array.isArray(videoSubtitles) ? (videoSubtitles as SRTItem[]) : JSON.stringify(videoSubtitles);
          tools = createSrtTools(subtitlesSource);
          logger.debug(`Loaded SRT tools for section ${this.sectionId} from video_subtitles.`);
        } catch (toolErr) {
          logger.warn(`Failed to create SRT tools for section ${this.sectionId}:`, toolErr);
        }
      } else {
        logger.debug(`No video_subtitles found for section ${this.sectionId}, SRT tools not attached.`);
      }
    } catch (err) {
      logger.warn(`Failed to load section ${this.sectionId} for SRT tools:`, err);
    }

    // 创建 ReactAgent（使用 MemorySaver 作为 checkpointer）
    this.agent = new ReactAgent({
      llm: createLLM(this.selectedModelConfig ?? modelConfigManager.getDefaultModel()),
      defaultThreadId: this.sessionId,
      checkpointSaver: new MemorySaver(),
      prompt: systemPrompt,
      tools: tools as any,
    });

    // 验证用户、章节、人设是否存在
    await this.validateEntities();

    logger.debug(`学习助手已初始化 - 用户: ${this.userId}, 章节: ${this.sectionId}, 会话: ${this.sessionId}`);
  }

  /** 与AI进行对话，保存交互记录到数据库 */
  async chat(userMessage: string): Promise<string> {
    try {
      const aiResponse = await this.agent.chat(userMessage, {
        configurable: { thread_id: this.sessionId },
      });

      await this.saveInteraction(userMessage, aiResponse);
      return aiResponse;
    } catch (error) {
      logger.error('对话处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`对话处理失败: ${errorMessage}`);
    }
  }

  /** 与AI进行流式对话，返回 Readable 流 */
  chatStream(userMessage: string): Readable {
    const readable = new Readable({
      async read() {
        // read方法会在需要数据时自动调用
      },
    });

    (async () => {
      try {
        logger.debug('🔄 开始流式对话处理...');

        const existingMessages = await this.agent.getConversationHistory(this.sessionId);
        const allMessages = [...existingMessages, new HumanMessage(userMessage)];

        const streamPromise = this.agent.stream(allMessages, {
          configurable: { thread_id: this.sessionId },
          streamMode: 'messages',
        });

        const stream = await streamPromise;
        let fullResponse = '';
        let messageCount = 0;

        for await (const chunk of stream) {
          messageCount++;
          try {
            let content = '';
            if (Array.isArray(chunk) && chunk.length > 0) {
              const messageObj = chunk[0];
              if (messageObj && typeof messageObj.content === 'string') {
                content = messageObj.content;
              }
            }

            if (content) {
              fullResponse += content;
              readable.push(content);
            } else if (messageCount <= 10) {
              logger.debug(`Chunk ${messageCount}: 无内容`);
            }
          } catch (chunkError) {
            logger.warn(`Chunk ${messageCount} 处理错误:`, chunkError);
            continue;
          }
        }

        if (fullResponse) {
          await this.saveInteraction(userMessage, fullResponse);
        } else {
          logger.warn('流式处理未产生结果，回退到普通模式');
          const response = await this.chat(userMessage);
          readable.push(response);
        }

        readable.push(null);
      } catch (error) {
        logger.error('流式对话处理失败:', error);
        try {
          logger.debug('回退到普通聊天模式...');
          const response = await this.chat(userMessage);
          readable.push(response);
          readable.push(null);
        } catch (fallbackError) {
          logger.error('流式对话 fallback 也失败:', fallbackError);
          readable.push('对话处理遇到问题，请稍后重试');
          readable.push(null);
        }
      }
    })();

    return readable;
  }

  /** 获取对话历史 */
  async getConversationHistory(): Promise<BaseMessage[]> {
    return this.agent.getConversationHistory(this.sessionId);
  }

  /** 获取最近几轮对话历史（用于 few-shot） */
  async getFewShotConversationHistory(limit = 2): Promise<BaseMessage[]> {
    const history = await this.getConversationHistory();
    return history.slice(-limit);
  }

  /** 基于近期对话生成额外引导问题 */
  async generateExtraQuestions(userMessage: string): Promise<string[]> {
    const fewShotHistory = await this.getFewShotConversationHistory();
    const systemPrompt = `你是一个学习助手，基于近期的对话内容，生成3个相关的额外问题，激发学生的深层思考。\n请按照固定的JSON数组格式输出：["问题1","问题2","问题3"]。你输出的内容必须能被json解析工具解析成数组，禁止携带其他内容。`;
    const messages: BaseMessage[] = [new SystemMessage(systemPrompt), ...fewShotHistory, new HumanMessage(userMessage)];
    const llm = createLLM(this.selectedModelConfig ?? modelConfigManager.getDefaultModel());
    const result = await llm.invoke(messages);
    const text = result.content as string;
    try {
      const questions = JSON.parse(text);
      if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
        return questions;
      }
      return [];
    } catch {
      // 尝试从文本中提取 JSON 数组
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end > start) {
        try {
          const questions = JSON.parse(text.substring(start, end + 1));
          if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
            return questions;
          }
        } catch {
          logger.warn('额外问题生成结果解析失败，返回空数组');
        }
      }
      return [];
    }
  }

  /** 获取用户在当前章节的所有会话 */
  async getUserSectionSessions() {
    const allSessions = await this.storage.getUserSessions(this.userId);
    return allSessions.filter(session => session.sectionId === this.sectionId);
  }

  /** 获取当前会话的统计分析 */
  async getSessionAnalytics() {
    return this.storage.getSessionAnalytics(this.sessionId);
  }

  /** 获取用户的学习记录和进度 */
  async getUserLearningProgress() {
    const [user] = await userDb.select().from(users).where(eq(users.user_id, this.userId));

    if (!user) {
      return { user: null, learningRecords: [], courseSchedules: [] };
    }

    const [records, schedules] = await Promise.all([
      userDb.select().from(learningRecords).where(eq(learningRecords.user_id, this.userId)),
      userDb.select().from(courseSchedules).where(eq(courseSchedules.user_id, this.userId)),
    ]);

    return { user, learningRecords: records, courseSchedules: schedules };
  }

  /** 获取课程信息（含关联章节） */
  async getCourseInfo() {
    if (!this.courseId) return null;

    const result = await mainDb.query.courses.findFirst({
      where: eq(courses.course_id, this.courseId!),
      with: {
        chapters: true,
        defaultPersona: true,
        tests: true,
      },
    });

    return result ?? null;
  }

  /** 获取课程大纲（章节结构） */
  async getCourseOutline(): Promise<string> {
    if (!this.courseId) {
      return '当前会话未关联课程信息';
    }

    const course = await this.getCourseInfo();
    if (!course) return '课程信息不存在';

    let outline = `📚 ${course.name}\n`;
    if (course.description) {
      outline += `📝 课程描述: ${course.description}\n\n`;
    }

    const chapterList = await mainDb.select().from(chapters).where(eq(chapters.course_id, this.courseId!)).orderBy(asc(chapters.chapter_order));

    if (chapterList.length === 0) {
      outline += '暂无章节内容';
      return outline;
    }

    outline += '📋 课程大纲:\n';

    for (let index = 0; index < chapterList.length; index++) {
      const chapter = chapterList[index]!;
      outline += `${index + 1}. ${chapter.title}\n`;

      const sectionList = await mainDb.select().from(sections).where(eq(sections.chapter_id, chapter.chapter_id)).orderBy(asc(sections.section_order));

      for (let sIdx = 0; sIdx < sectionList.length; sIdx++) {
        const section = sectionList[sIdx]!;
        outline += `   ${index + 1}.${sIdx + 1} ${section.title}`;
        if (section.estimated_time) {
          outline += ` (${section.estimated_time}分钟)`;
        }
        outline += '\n';
      }
    }

    return outline;
  }

  /** 获取当前章节在课程中的上下文信息 */
  async getSectionContext(): Promise<string> {
    const sectionResult = await mainDb.query.sections.findFirst({
      where: eq(sections.section_id, this.sectionId),
      with: {
        chapter: {
          with: {
            course: true,
          },
        },
      },
    });

    if (!sectionResult) return '章节信息不存在';

    let context = `📖 当前章节: ${sectionResult.title}\n`;

    if (sectionResult.chapter) {
      context += `📚 所属章节: ${sectionResult.chapter.title}\n`;
      if (sectionResult.chapter.course) {
        context += `🎓 所属课程: ${sectionResult.chapter.course.name}\n`;
        this.courseId = sectionResult.chapter.course.course_id;
      }
    }

    if (sectionResult.knowledge_points) {
      context += `🎯 知识点: ${sectionResult.knowledge_points}\n`;
    }
    if (sectionResult.knowledge_content) {
      context += `📋 内容概要: ${sectionResult.knowledge_content}\n`;
    }
    if (sectionResult.estimated_time) {
      context += `⏱️ 预计时间: ${sectionResult.estimated_time}分钟\n`;
    }

    return context;
  }

  // ── 私有方法 ─────────────────────────────────────

  private async loadCourseInfo(): Promise<void> {
    if (!this.courseId) {
      const sectionContext = await this.getSectionContext();
      logger.debug('📖 从章节加载课程上下文:', sectionContext.split('\n')[0]);
    }

    if (!this.courseId) return;

    const course = await this.getCourseInfo();
    if (!course) {
      logger.debug('⚠️ 课程信息加载失败:', this.courseId);
      return;
    }

    logger.debug(`📚 已加载课程: ${course.name}`);

    if (!this.personaId && course.default_ai_persona_id) {
      this.personaId = course.default_ai_persona_id;
      logger.debug(`🎭 使用课程默认AI人设: ${course.defaultPersona?.name ?? this.personaId}`);
    }
  }

  private async createSystemPrompt() {
    let systemPromptText = '';
    let personaPrompt = '信心十足的教育家，耐心且乐于助人。';

    if (this.personaId) {
      const [persona] = await mainDb.select().from(aiPersonas).where(eq(aiPersonas.persona_id, this.personaId));
      if (persona) {
        personaPrompt = persona.prompt;
      }
    }

    const requirements = this.requirements ?? '请耐心解答学生的问题';

    try {
      if (this.courseId) {
        const courseOutline = await this.getCourseOutline();
        const sectionContext = await this.getSectionContext();
        systemPromptText = await getPromptWithArgs(KEY_LEARNING_ASSISTANT, {
          sectionContext,
          courseOutline,
          personaPrompt,
          requirements,
        });
      } else {
        systemPromptText = await getPromptWithArgs(KEY_LEARNING_ASSISTANT_FALLBACK, {
          requirements,
        });
      }
    } catch (error) {
      logger.warn('Failed to load system prompt template, using hardcoded fallback:', error);
      if (this.courseId) {
        const courseOutline = await this.getCourseOutline();
        const sectionContext = await this.getSectionContext();
        systemPromptText = `## 当前学习环境\n\n${sectionContext}\n\n## 完整课程信息\n\n${courseOutline}\n\n## 角色\n\n${personaPrompt}\n\n## 重要要求\n\n${requirements}`;
      } else {
        systemPromptText = `## AI学习助手\n\n你是一个智能学习助手，专门帮助学生学习和答疑。请根据学生的问题提供准确、有用的学习指导。\n\n## 重要要求\n\n${requirements}`;
      }
    }

    return new SystemMessage(systemPromptText);
  }

  async cleanup(): Promise<void> {
    // PGlite 进程内模式，无需主动断开连接
  }

  getSessionId(): string {
    return this.sessionId;
  }
  getUserId(): string {
    return this.userId;
  }
  getSectionId(): string {
    return this.sectionId;
  }
  getCourseId(): string | undefined {
    return this.courseId;
  }
  getPersonaId(): string | undefined {
    return this.personaId;
  }

  private async validateEntities(): Promise<void> {
    const [user] = await userDb.select().from(users).where(eq(users.user_id, this.userId));
    if (!user) throw new Error(`用户不存在: ${this.userId}`);

    const isDemoSection = this.sectionId === '00000000-0000-0000-0000-000000000001';
    if (!isDemoSection) {
      const [section] = await mainDb.select().from(sections).where(eq(sections.section_id, this.sectionId));
      if (!section) throw new Error(`章节不存在: ${this.sectionId}`);
    } else {
      logger.debug('⚠️ 跳过演示用虚拟章节的验证');
    }

    if (this.personaId) {
      const [persona] = await mainDb.select().from(aiPersonas).where(eq(aiPersonas.persona_id, this.personaId));
      if (!persona) throw new Error(`AI人设不存在: ${this.personaId}`);
    }
  }

  private async saveInteraction(userMessage: string, aiResponse: string): Promise<void> {
    const result = await userDb
      .insert(aiInteractions)
      .values({
        user_id: this.userId,
        section_id: this.sectionId,
        session_id: this.sessionId,
        user_message: userMessage,
        ai_response: aiResponse,
        query_time: new Date(),
        persona_id_in_use: this.personaId ?? null,
      })
      .returning();

    logger.debug(`💾 对话记录已保存: ${result[0]?.interaction_id}`);
  }
}

// ── 工厂函数 ────────────────────────────────────────

/** 创建并初始化学习助手实例 */
export async function createLearningAssistant(
  userId: string,
  sectionId: string,
  personaId?: string,
  sessionId?: string,
  courseId?: string,
  requirements?: string,
  modelName?: string,
  reasoning?: boolean,
): Promise<LearningAssistant> {
  const assistant = new LearningAssistant({
    userId,
    courseId,
    sectionId,
    personaId: normalizePersonaId(personaId),
    sessionId,
    requirements,
    modelName,
    reasoning,
  });
  await assistant.initialize();
  return assistant;
}

/** 为指定用户和章节启动新的学习会话 */
export async function startNewLearningSession(userId: string, sectionId: string, personaId?: string, courseId?: string, modelName?: string, reasoning?: boolean): Promise<LearningAssistant> {
  const sessionId = IntegratedStorage.generateSessionId(userId, sectionId);
  return createLearningAssistant(userId, sectionId, personaId, sessionId, courseId, undefined, modelName, reasoning);
}

/** 根据 sessionId 恢复已有学习会话 */
export async function resumeLearningSession(
  userId: string,
  sessionId: string,
  personaId?: string,
  requirements?: string,
  modelName?: string,
  reasoning?: boolean,
): Promise<LearningAssistant> {
  const parts = sessionId.split('_');
  if (parts.length < 4) {
    throw new Error(`无效的会话ID格式: ${sessionId}`);
  }
  const sectionId = parts[2]!;

  // 未指定 personaId 时，从历史交互记录中取最近一次使用的人设作为兜底
  let resolvedPersonaId = normalizePersonaId(personaId);
  if (!resolvedPersonaId) {
    const [lastInteraction] = await userDb
      .select({ persona_id_in_use: aiInteractions.persona_id_in_use })
      .from(aiInteractions)
      .where(and(eq(aiInteractions.session_id, sessionId), isNotNull(aiInteractions.persona_id_in_use)))
      .orderBy(desc(aiInteractions.query_time))
      .limit(1);
    resolvedPersonaId = lastInteraction?.persona_id_in_use ?? undefined;
  }

  return createLearningAssistant(userId, sectionId, resolvedPersonaId, sessionId, undefined, requirements, modelName, reasoning);
}

/** 为指定课程创建学习助手，自动选择第一个章节（若未指定） */
export async function createCourseAssistant(userId: string, courseId: string, sectionId?: string, requirements?: string, modelName?: string): Promise<LearningAssistant> {
  let finalSectionId = sectionId;

  if (!finalSectionId) {
    const [firstChapter] = await mainDb.select().from(chapters).where(eq(chapters.course_id, courseId)).orderBy(asc(chapters.chapter_order)).limit(1);

    if (firstChapter) {
      const [firstSection] = await mainDb.select().from(sections).where(eq(sections.chapter_id, firstChapter.chapter_id)).orderBy(asc(sections.section_order)).limit(1);

      if (firstSection) {
        finalSectionId = firstSection.section_id;
        logger.debug(`📖 自动选择课程第一个章节: ${firstSection.title}`);
      }
    }
  }

  if (!finalSectionId) {
    throw new Error('无法确定课程的章节信息，请指定 sectionId');
  }

  return createLearningAssistant(userId, finalSectionId, undefined, undefined, courseId, requirements, modelName);
}

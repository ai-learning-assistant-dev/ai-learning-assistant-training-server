import logger from '../../utils/logger';
import SingleChat from '../agent/single_chat';
import type { LearningReviewRequest } from '../../schemas/aiChat';
import { Readable } from 'stream';
import { getPromptWithArgs } from '../prompt/manager';
import { KEY_LEARNING_REVIEW } from '../prompt/default';
import { eq, desc, asc } from 'drizzle-orm';
import { mainDb, userDb } from '@db/index';
import { sections, exercises } from '@db/main/schema';
import { aiInteractions, exerciseResults } from '@db/user/schema';
import { modelConfigManager } from '../utils/modelConfigManager';
import { createLLM } from '../utils/create_llm';

export type LearningReviewEvaluatorOptions = {
  tools?: unknown[];
  modelName?: string;
  reasoning?: boolean;
};

/**
 * 学习总结评估器：生成学生学完一节课后的总结评语
 * 综合聊天记录、课程大纲、题目和成绩，输出评估和学习建议
 */
export class LearningReviewEvaluator {
  private chatOptions?: LearningReviewEvaluatorOptions;
  private readonly MAX_TOKENS = 96000;

  constructor(chatOptions?: LearningReviewEvaluatorOptions) {
    this.chatOptions = chatOptions;
  }

  /** 生成学习总结评语，返回流式输出和完整文本 Promise */
  async evaluate(req: LearningReviewRequest): Promise<{ stream: Readable; fullTextPromise: Promise<string> }> {
    try {
      logger.debug('正在生成学习总结评语:', JSON.stringify(req, null, 2));

      const sectionOutline = await this.getSectionOutline(req.sectionId);
      const exerciseData = await this.getExerciseData(req.userId, req.sectionId);
      const chatHistory = await this.getChatHistory(req.sessionId);
      const instruction = await this.buildPrompt(sectionOutline, exerciseData, chatHistory);

      const llmModel = this.chatOptions?.modelName ? modelConfigManager.getModelConfig(this.chatOptions.modelName) : modelConfigManager.getDefaultModel();
      const llm = llmModel ? createLLM(llmModel) : undefined;
      const sc = new SingleChat({ llm, reasoning: this.chatOptions?.reasoning ?? true });

      const readable = new Readable({
        read() {},
      });

      const fullTextPromise = (async () => {
        let fullResponse = '';
        try {
          const streamIter = await sc.stream(instruction);
          let chunkIndex = 0;

          for await (const chunk of streamIter) {
            chunkIndex++;
            try {
              let content = '';
              if (chunkIndex <= 3) {
                logger.debug(`[LearningReview] Chunk ${chunkIndex} structure:`, JSON.stringify(chunk).substring(0, 200));
              }
              if (Array.isArray(chunk) && chunk.length > 0) {
                const messageChunk = chunk[0];
                if (messageChunk?.kwargs?.content) {
                  content = messageChunk.kwargs.content;
                } else if (typeof messageChunk?.content === 'string') {
                  content = messageChunk.content;
                }
              } else if (typeof chunk === 'string') {
                content = chunk;
              } else if (chunk && typeof (chunk as any).content === 'string') {
                content = (chunk as any).content;
              }
              if (content) {
                fullResponse += content;
                readable.push(content);
              }
            } catch (chunkErr) {
              logger.warn(`[LearningReview] Chunk ${chunkIndex} 处理错误:`, chunkErr);
              continue;
            }
          }

          if (!fullResponse) {
            logger.warn('学习总结流未产生内容，回退到非流模式');
            const fallback = await sc.chat(instruction);
            fullResponse = fallback;
            readable.push(fallback);
          }

          readable.push(null);
          logger.debug('学习总结评语生成成功 (stream)');
          return fullResponse;
        } catch (err) {
          logger.error('学习总结评语流式生成失败:', err);
          try {
            logger.debug('回退到普通模式生成学习总结评语');
            const fallback = await sc.chat(instruction);
            readable.push(fallback);
            readable.push(null);
            return fallback;
          } catch (fallbackErr) {
            const message = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
            readable.destroy(new Error(`学习总结评语生成失败: ${message}`));
            throw fallbackErr;
          }
        } finally {
          await sc.cleanup();
        }
      })();

      return { stream: readable, fullTextPromise };
    } catch (err) {
      logger.error('学习总结评语生成失败:', err);
      throw new Error(`学习总结评语生成失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 获取课程大纲
  private async getSectionOutline(sectionId: string): Promise<string> {
    const section = await mainDb.query.sections.findFirst({
      where: eq(sections.section_id, sectionId),
      with: { chapter: true },
    });

    if (!section) throw new Error(`未找到章节: ${sectionId}`);

    let outline = `# ${section.title}\n\n`;

    if (section.knowledge_points) {
      outline += `## 知识点\n`;
      if (Array.isArray(section.knowledge_points)) {
        (section.knowledge_points as string[]).forEach((point: string) => {
          outline += `- ${point}\n`;
        });
      } else {
        outline += `${JSON.stringify(section.knowledge_points, null, 2)}\n`;
      }
      outline += '\n';
    }

    if (section.knowledge_content) {
      outline += `## 知识内容\n`;
      if (typeof section.knowledge_content === 'string') {
        outline += section.knowledge_content + '\n';
      } else {
        outline += JSON.stringify(section.knowledge_content, null, 2) + '\n';
      }
      outline += '\n';
    }

    return outline;
  }

  // 获取题目和成绩
  private async getExerciseData(userId: string, sectionId: string): Promise<string> {
    const exerciseList = await mainDb.select().from(exercises).where(eq(exercises.section_id, sectionId)).orderBy(asc(exercises.exercise_id));

    if (exerciseList.length === 0) return '该节暂无练习题';

    let data = `## 练习题及完成情况\n\n`;

    for (const exercise of exerciseList) {
      data += `### 题目: ${exercise.question}\n`;
      data += `类型: ${this.getExerciseTypeName(exercise.type_status)}\n`;
      if (exercise.answer) {
        data += `参考答案: ${exercise.answer}\n`;
      }

      // 获取用户的最新答题结果
      const [result] = await userDb.select().from(exerciseResults).where(eq(exerciseResults.user_id, userId)).orderBy(desc(exerciseResults.result_id)).limit(1);

      if (result) {
        data += `学生答案: ${result.user_answer || '未作答'}\n`;
        data += `得分: ${result.score !== null && result.score !== undefined ? result.score : '未评分'}/${exercise.score}\n`;
        if (result.ai_feedback) {
          data += `AI反馈: ${result.ai_feedback}\n`;
        }
      } else {
        data += `学生答案: 未作答\n`;
      }

      data += '\n';
    }

    return data;
  }

  // 获取聊天记录（从最新往前拼接，直到超出 token 限制）
  private async getChatHistory(sessionId: string): Promise<string> {
    const interactions = await userDb.select().from(aiInteractions).where(eq(aiInteractions.session_id, sessionId)).orderBy(desc(aiInteractions.query_time));

    if (interactions.length === 0) return '暂无聊天记录';

    let history = '';
    let estimatedTokens = 0;
    const reservedTokens = 20000;

    for (const interaction of interactions) {
      const entry = `用户: ${interaction.user_message}\nAI: ${interaction.ai_response}\n\n`;
      const entryTokens = this.estimateTokens(entry);

      if (estimatedTokens + entryTokens + reservedTokens > this.MAX_TOKENS) {
        logger.debug(`聊天记录已达到token限制，共包含 ${history.split('用户:').length - 1} 轮对话`);
        break;
      }

      history = entry + history;
      estimatedTokens += entryTokens;
    }

    return `## 聊天记录\n\n${history}`;
  }

  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords;
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5);
  }

  private async buildPrompt(sectionOutline: string, exerciseData: string, chatHistory: string): Promise<string> {
    try {
      return await getPromptWithArgs(KEY_LEARNING_REVIEW, {
        sectionOutline,
        exerciseData,
        chatHistory,
      });
    } catch (err) {
      logger.warn('Failed to get prompt template from DB, using default:', err);
      return `你是一个专业的学习评估专家，请根据以下信息为学生生成一份学习总结评语：

${sectionOutline}

${exerciseData}

${chatHistory}

请基于以上信息，分析学生的学习情况，生成一份详细的学习总结评语。

要求：
1. 使用友好、鼓励的语气
2. 包含以下内容：
   - 表现良好的方面（2-5条）
   - 需要加强的方面（2-5条）
   - 推荐额外学习的相关知识点（2-5条）
   - 总体评价和鼓励
3. 使用清晰的段落结构，便于阅读
4. 直接输出评语文本，不要使用JSON格式

分析维度：
- 知识点掌握程度（根据练习题完成情况）
- 学习态度和主动性（根据聊天记录中的提问质量和频率）
- 理解深度（根据对话中的思考深度）
- 答题准确性（根据练习成绩）`;
    }
  }

  private getExerciseTypeName(typeStatus: string): string {
    const types: Record<string, string> = {
      '0': '单选题',
      '1': '多选题',
      '2': '简答题',
    };
    return types[typeStatus] || '未知类型';
  }
}

export default LearningReviewEvaluator;

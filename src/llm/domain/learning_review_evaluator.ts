import SingleChat from '../agent/single_chat';
import type { LearningReviewRequest } from '../../types/AiChat';
import { Readable } from 'stream';
import { getPromptWithArgs } from '../prompt/manager';
import { KEY_LEARNING_REVIEW } from '../prompt/default';
import { MainDataSource, UserDataSource } from '../../config/database';
import { AiInteraction } from '../../models/aiInteraction';
import { Section } from '../../models/section';
import { Exercise } from '../../models/exercise';
import { ExerciseResult } from '../../models/exerciseResult';
import { modelConfigManager } from '../utils/modelConfigManager';
import { create } from 'domain';
import { createLLM } from '../utils/create_llm';

export type LearningReviewEvaluatorOptions = {
  tools?: any[];
  modelName?: string;
};

/**
 * LearningReviewEvaluator
 *
 * 用于生成学生学习完一节课后的总结评语。
 * 输入：聊天记录、课程大纲、题目和学习成绩
 * 输出：需要加强的方面、推荐额外学习的知识点
 */
export class LearningReviewEvaluator {
  private chatOptions?: LearningReviewEvaluatorOptions;
  private readonly MAX_TOKENS = 96000;  // 上下文token限制

  constructor(chatOptions?: LearningReviewEvaluatorOptions) {
    this.chatOptions = chatOptions;
  }

  /**
   * 生成学习总结评语
   */
  async evaluate(req: LearningReviewRequest): Promise<{ stream: Readable; fullTextPromise: Promise<string> }> {
    try {
      console.log('正在生成学习总结评语:', JSON.stringify(req, null, 2));

      // 1. 获取课程大纲（section的知识点）
      const sectionOutline = await this.getSectionOutline(req.sectionId);

      // 2. 获取题目和成绩
      const exerciseData = await this.getExerciseData(req.userId, req.sectionId);

      // 3. 获取聊天记录（从下到上拼接，直到达到token限制）
      const chatHistory = await this.getChatHistory(req.sessionId);

      // 4. 构建提示词
      const instruction = await this.buildPrompt(sectionOutline, exerciseData, chatHistory);

      // 5. 调用LLM
      const llmModel = this.chatOptions?.modelName ? modelConfigManager.getModelConfig(this.chatOptions.modelName) : modelConfigManager.getDefaultModel();
      const llm = llmModel ? createLLM(llmModel) : undefined;
      const sc = new SingleChat({ llm });

      const readable = new Readable({
        read() {
          // no-op; data pushed asynchronously
        }
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
                console.log(`[LearningReview] Chunk ${chunkIndex} structure:`, JSON.stringify(chunk).substring(0, 200));
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
              console.warn(`[LearningReview] Chunk ${chunkIndex} 处理错误:`, chunkErr);
              continue;
            }
          }

          if (!fullResponse) {
            console.warn('学习总结流未产生内容，回退到非流模式');
            const fallback = await sc.chat(instruction);
            fullResponse = fallback;
            readable.push(fallback);
          }

          readable.push(null);
          console.log('学习总结评语生成成功 (stream)');
          return fullResponse;
        } catch (err) {
          console.error('学习总结评语流式生成失败:', err);
          try {
            console.log('回退到普通模式生成学习总结评语');
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
      console.error('学习总结评语生成失败:', err);
      throw new Error(`学习总结评语生成失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 获取课程大纲
   */
  private async getSectionOutline(sectionId: string): Promise<string> {
    if (!MainDataSource.isInitialized) {
      throw new Error("MainDataSource 未初始化");
    }

    const sectionRepo = MainDataSource.getRepository(Section);
    const section = await sectionRepo.findOne({
      where: { section_id: sectionId },
      relations: ['chapter']
    });

    if (!section) {
      throw new Error(`未找到章节: ${sectionId}`);
    }

    let outline = `# ${section.title}\n\n`;

    // 知识点
    if (section.knowledge_points) {
      outline += `## 知识点\n`;
      if (Array.isArray(section.knowledge_points)) {
        section.knowledge_points.forEach((point: string) => {
          outline += `- ${point}\n`;
        });
      } else {
        outline += `${JSON.stringify(section.knowledge_points, null, 2)}\n`;
      }
      outline += '\n';
    }

    // 知识内容
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

  /**
   * 获取题目和成绩
   */
  private async getExerciseData(userId: string, sectionId: string): Promise<string> {
    if (!MainDataSource.isInitialized || !UserDataSource.isInitialized) {
      throw new Error("DataSource 未初始化");
    }

    const exerciseRepo = MainDataSource.getRepository(Exercise);
    const exerciseResultRepo = UserDataSource.getRepository(ExerciseResult);

    // 获取该节的所有题目
    const exercises = await exerciseRepo.find({
      where: { section_id: sectionId },
      order: { exercise_id: 'ASC' }
    });

    if (exercises.length === 0) {
      return '该节暂无练习题';
    }

    let data = `## 练习题及完成情况\n\n`;

    for (const exercise of exercises) {
      data += `### 题目: ${exercise.question}\n`;
      data += `类型: ${this.getExerciseTypeName(exercise.type_status)}\n`;
      
      if (exercise.answer) {
        data += `参考答案: ${exercise.answer}\n`;
      }

      // 获取用户的答题结果
      const result = await exerciseResultRepo.findOne({
        where: {
          user_id: userId,
          exercise_id: exercise.exercise_id
        },
        order: { result_id: 'DESC' } // 获取最新的答题记录
      });

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

  /**
   * 获取聊天记录（从下到上拼接，直到超出token限制）
   */
  private async getChatHistory(sessionId: string): Promise<string> {
    if (!UserDataSource.isInitialized) {
      throw new Error("UserDataSource 未初始化");
    }

    const aiInteractionRepo = UserDataSource.getRepository(AiInteraction);
    
    // 按时间倒序获取所有交互记录
    const interactions = await aiInteractionRepo.find({
      where: { session_id: sessionId },
      order: { query_time: 'DESC' } // 最新的在前面
    });

    if (interactions.length === 0) {
      return '暂无聊天记录';
    }

    let history = '';
    let estimatedTokens = 0;
    const reservedTokens = 20000; // 为大纲、题目和系统提示预留的token

    // 从最新的记录开始往前拼接
    for (const interaction of interactions) {
      const entry = `用户: ${interaction.user_message}\nAI: ${interaction.ai_response}\n\n`;
      const entryTokens = this.estimateTokens(entry);

      // 检查是否会超出限制
      if (estimatedTokens + entryTokens + reservedTokens > this.MAX_TOKENS) {
        console.log(`聊天记录已达到token限制，共包含 ${history.split('用户:').length - 1} 轮对话`);
        break;
      }

      // 因为是倒序读取，所以要把新记录加在前面
      history = entry + history;
      estimatedTokens += entryTokens;
    }

    return `## 聊天记录\n\n${history}`;
  }

  /**
   * 简单估算token数量（中文按字符数计算，英文按单词数计算）
   * 这是一个粗略估算，实际token数可能不同
   */
  private estimateTokens(text: string): number {
    // 中文字符大约1个字=1.5个token
    // 英文单词大约1个词=1.3个token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords;

    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5);
  }

  /**
   * 构建提示词
   */
  private async buildPrompt(
    sectionOutline: string,
    exerciseData: string,
    chatHistory: string
  ): Promise<string> {
    try {
      // 尝试从数据库获取提示词模板
      return await getPromptWithArgs(KEY_LEARNING_REVIEW, {
        sectionOutline,
        exerciseData,
        chatHistory
      });
    } catch (err) {
      console.warn('Failed to get prompt template from DB, using default:', err);
      
      // 使用默认提示词
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



  /**
   * 获取题目类型名称
   */
  private getExerciseTypeName(typeStatus: string): string {
    const types: Record<string, string> = {
      '0': '单选题',
      '1': '多选题',
      '2': '简答题'
    };
    return types[typeStatus] || '未知类型';
  }
}

export default LearningReviewEvaluator;

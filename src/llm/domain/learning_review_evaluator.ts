import SingleChat from '../agent/single_chat';
import type { LearningReviewRequest, LearningReviewResponse } from '../../types/AiChat';
import { getPromptWithArgs } from '../prompt/manager';
import { KEY_LEARNING_REVIEW } from '../prompt/default';
import { MainDataSource, UserDataSource } from '../../config/database';
import { AiInteraction } from '../../models/aiInteraction';
import { Section } from '../../models/section';
import { Exercise } from '../../models/exercise';
import { ExerciseResult } from '../../models/exerciseResult';

/**
 * LearningReviewEvaluator
 *
 * 用于生成学生学习完一节课后的总结评语。
 * 输入：聊天记录、课程大纲、题目和学习成绩
 * 输出：需要加强的方面、推荐额外学习的知识点
 */
export class LearningReviewEvaluator {
  private chatOptions?: any;
  private readonly MAX_TOKENS = 96000;  // 上下文token限制

  constructor(chatOptions?: any) {
    this.chatOptions = chatOptions;
  }

  /**
   * 生成学习总结评语
   */
  async evaluate(req: LearningReviewRequest): Promise<LearningReviewResponse> {
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
      const sc = new SingleChat(this.chatOptions);
      try {
        const response = await sc.chat(instruction);
        
        // 6. 解析响应
        const result = this.parseResponse(response);
        
        console.log('学习总结评语生成成功');
        return result;
      } finally {
        await sc.cleanup();
      }
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

请基于以上信息，分析学生的学习情况，输出严格的 JSON 对象，格式如下：

{
  "strengths": ["表现良好的方面1", "表现良好的方面2", ...],
  "weaknesses": ["需要加强的方面1", "需要加强的方面2", ...],
  "recommendations": ["推荐额外学习的知识点1", "推荐额外学习的知识点2", ...],
  "overallComment": "总体评语（100-200字）"
}

要求：
1. 严格输出JSON格式，不要包含其他文本
2. strengths: 列出学生在学习过程中表现良好的方面（2-5条）
3. weaknesses: 列出需要加强的方面（2-5条）
4. recommendations: 推荐额外学习的相关知识点（2-5条）
5. overallComment: 综合评价，鼓励为主，指出改进方向

分析维度：
- 知识点掌握程度（根据练习题完成情况）
- 学习态度和主动性（根据聊天记录中的提问质量和频率）
- 理解深度（根据对话中的思考深度）
- 答题准确性（根据练习成绩）`;
    }
  }

  /**
   * 解析LLM响应
   */
  private parseResponse(response: string): LearningReviewResponse {
    try {
      // 尝试提取JSON（有时LLM会在JSON前后加一些说明文字）
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('响应中未找到JSON对象');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 验证必要字段
      if (!parsed.strengths || !Array.isArray(parsed.strengths)) {
        throw new Error('缺少或格式错误: strengths');
      }
      if (!parsed.weaknesses || !Array.isArray(parsed.weaknesses)) {
        throw new Error('缺少或格式错误: weaknesses');
      }
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('缺少或格式错误: recommendations');
      }
      if (!parsed.overallComment || typeof parsed.overallComment !== 'string') {
        throw new Error('缺少或格式错误: overallComment');
      }

      return {
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        recommendations: parsed.recommendations,
        overallComment: parsed.overallComment
      };
    } catch (err) {
      console.error('解析响应失败:', err);
      console.error('原始响应:', response);
      
      // 返回默认值
      return {
        strengths: ['积极参与学习'],
        weaknesses: ['建议多做练习'],
        recommendations: ['复习本节知识点'],
        overallComment: '继续保持学习热情，多加练习！'
      };
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

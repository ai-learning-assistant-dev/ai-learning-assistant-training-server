import SingleChat from '../agent/single_chat';
import type { AnswerEvaluateRequest, AnswerEvaluateResponse } from '../../types/AiChat';

/**
 * AnswerEvaluator
 *
 * 用于对学生的简答题答案进行一次性评估的工具类。
 * 调用外部大模型（通过 SingleChat）返回评语与分数。
 */
export class AnswerEvaluator {
  private chatOptions?: any;

  constructor(chatOptions?: any) {
    this.chatOptions = chatOptions;
  }

  /**
   * 评估学生答案。
   * 返回结构：{ reply: string, score: number }
   */
  async evaluate(req: AnswerEvaluateRequest): Promise<AnswerEvaluateResponse> {
    const sc = new SingleChat(this.chatOptions);
    try {
      // Compose an instruction prompt that asks the model to reply in JSON
      const instruction = `你是一个简答题评分专家。请根据题目、参考答案与先验知识，对学生回答进行评价。
要求：
1) 输出严格的 JSON 对象，形如 {"reply": "评语文本", "score": 0-100 的整数}，不要输出其他多余文本或解释。
2) 分数范围 0 到 100，整数。

下面是评估内容：
题目: ${req.question}
参考答案: ${req.standardAnswer}
先验知识说明: ${req.priorKnowledge || '无'}
评分提示: ${req.prompt || '请自行评分'}
学生答案: ${req.studentAnswer}

请基于参考答案的要点与先验知识衡量学生答案的正确性、完整性与表达，给出简洁评语和分数。`;

      const reply = await sc.chat(instruction);

      // Try to extract JSON from model reply
      const json = this.extractJson(reply);
      if (json) {
        const score = Number(json.score ?? json.sc ?? json.points ?? 0) || 0;
        const text = String(json.reply ?? json.comment ?? json.feedback ?? json.text ?? reply);
        return { reply: text, score: Math.max(0, Math.min(100, Math.round(score))) };
      }

      // Fallback: try to find a number in reply and use rest as feedback
      const numMatch = reply.match(/(\d{1,3})\s*(?:分|points|score)?/i);
      let score = 0;
      if (numMatch) {
        score = Math.max(0, Math.min(100, parseInt(numMatch[1], 10)));
      }
      const text = reply.trim();
      return { reply: text, score };

    } finally {
      await sc.cleanup();
    }
  }

  private extractJson(text: string): any | null {
    if (!text) return null;
    // Try to find JSON object in text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (err) {
        // ignore
      }
    }
    // If direct JSON not found, try to parse the whole text
    try {
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  }
}

export default AnswerEvaluator;

import logger from '../../utils/logger';
import SingleChat from '../agent/single_chat';
import { Readable } from 'stream';
import { getPromptWithArgs } from '../prompt/manager';
import { KEY_DAILY_CHAT } from '../prompt/default';
import { type ModelConfig, modelConfigManager } from '../utils/modelConfigManager';
import { createLLM } from '../utils/create_llm';
import { IntegratedStorage } from '../storage/integrated_storage';

/**
 * 每日聊天：基于 SingleChat 的轻量一次性对话封装
 * 使用固定的 sessionId 和内置记忆，支持普通对话和流式对话
 */
export class DailyChat {
  private sc: SingleChat;
  /** 临时会话ID */
  static sessionId = IntegratedStorage.generateMockSessionId();
  private static readonly FIXED_PERSONA_NAME = '信心十足的教育家';

  private constructor(sc: SingleChat) {
    this.sc = sc;
    logger.debug(`DailyChat created with sessionId=${DailyChat.sessionId}, persona=${DailyChat.FIXED_PERSONA_NAME}, memory enabled=${true}`);
  }

  /** 工厂方法：创建 DailyChat 实例，加载提示词和模型配置 */
  static async create(options?: DailyChatOptions): Promise<DailyChat> {
    try {
      // simple system prompt can be passed via options.prompt or default
      const realRequirements = options?.requirements || '请简要回答';
      const personaPrompt = `信心十足的教育家`;
      const prompt = await getPromptWithArgs(KEY_DAILY_CHAT, { requirements: realRequirements, personaPrompt });
      const modelConfig = options?.modelName ? modelConfigManager.getModelConfig(options.modelName) : modelConfigManager.getDefaultModel();
      if (modelConfig && options?.reasoning !== undefined) {
        modelConfig.reasoning = options.reasoning;
      }
      const llm = modelConfig ? createLLM(modelConfig) : undefined;

      const sc = new SingleChat({
        prompt,
        enableMemory: true,
        tools: options?.tools,
        llm,
        reasoning: options?.reasoning,
        threadId: DailyChat.sessionId, // 固定threadId以保持会话一致
      });
      return new DailyChat(sc);
    } catch (error) {
      logger.error('DailyChat.create 创建实例失败:', error);
      throw error;
    }
  }

  /** 发送消息并获取最终回复文本 */
  async chat(userInput: string): Promise<string> {
    try {
      logger.debug(`DailyChat.chat [${DailyChat.sessionId}] request:`, userInput);
      const reply = await this.sc.chat(userInput);
      logger.debug(`DailyChat.chat [${DailyChat.sessionId}] reply:`, reply);
      return reply;
    } catch (err) {
      logger.error('DailyChat.chat error:', err);
      throw err;
    }
  }

  /** 流式输出对话结果，返回 Node Readable 流 */
  stream(userInput: string, options?: Record<string, any>): Readable {
    logger.debug(`DailyChat.stream [${DailyChat.sessionId}] request:`, userInput);

    const readable = new Readable({
      async read() {
        // no-op; we push data asynchronously
      },
    });

    (async () => {
      try {
        // call SingleChat.stream which should return an async iterable
        const streamIter = await this.sc.stream(userInput, options);

        let fullResponse = '';
        let chunkIndex = 0;

        for await (const chunk of streamIter) {
          chunkIndex++;
          try {
            let content = '';

            // Debug: log first few chunks
            if (chunkIndex <= 3) {
              logger.debug(`[DailyChat] Chunk ${chunkIndex} structure:`, JSON.stringify(chunk).substring(0, 200));
            }

            // Handle LangGraph stream format: [AIMessageChunk, metadata]
            if (Array.isArray(chunk) && chunk.length > 0) {
              const messageChunk = chunk[0];
              // Extract from kwargs.content (LangChain message format)
              if (messageChunk?.kwargs?.content) {
                content = messageChunk.kwargs.content;
              }
              // Fallback: check if it's a plain object with content property
              else if (typeof messageChunk?.content === 'string') {
                content = messageChunk.content;
              }
            }
            // Handle string chunks
            else if (typeof chunk === 'string') {
              content = chunk;
            }
            // Handle object with content property
            else if (chunk && typeof chunk.content === 'string') {
              content = chunk.content;
            }

            if (content) {
              fullResponse += content;
              readable.push(content);
              logger.debug(`[DailyChat] Pushed content (${content.length} chars)`);
            }
          } catch (chunkErr) {
            logger.warn(`Chunk ${chunkIndex} 处理错误:`, chunkErr);
            continue;
          }
        }

        // If the stream produced nothing, fallback to chat()
        if (!fullResponse) {
          logger.warn('流式处理未产生结果，回退到普通模式');
          const response = await this.chat(userInput);
          readable.push(response);
        }

        // mark end of stream
        readable.push(null);
      } catch (err) {
        logger.error('流式对话处理失败:', err);
        // fallback to chat
        try {
          logger.debug('回退到普通聊天模式...');
          const response = await this.chat(userInput);
          readable.push(response);
          readable.push(null);
        } catch (fallbackErr) {
          const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          logger.error('DailyChat 流式对话 fallback 也失败:', errorMessage);
          readable.push('对话处理遇到问题: ' + errorMessage);
          readable.push(null);
        }
      }
    })();

    return readable;
  }

  /** 清理内部资源 */
  async cleanup(): Promise<void> {
    try {
      await this.sc.cleanup();
      logger.debug(`DailyChat cleaned up session=${DailyChat.sessionId}`);
    } catch (err) {
      logger.warn('DailyChat.cleanup error:', err);
    }
  }
}

export class DailyChatOptions {
  tools?: any[];
  requirements?: string;
  modelName?: string;
  reasoning?: boolean;
}

export default DailyChat;

import SingleChat from '../agent/single_chat';
import { Readable } from 'stream';
import { getPromptWithArgs } from '../prompt/manager';
import { KEY_DAILY_CHAT } from '../prompt/default';
import { ModelConfig, modelConfigManager } from '../utils/modelConfigManager';
import { createLLM } from '../utils/create_llm';

/**
 * DailyChat
 *
 * A lightweight disposable agent built on SingleChat for one-off daily conversations.
 * - session id is fixed to '12345672'
 * - memory is enabled for the lifetime of the SingleChat instance
 * - exposes chat and stream methods
 */
export class DailyChat {
  private sc: SingleChat;
  private sessionId = '12345672';
  private static readonly FIXED_PERSONA_NAME = '信心十足的教育家';

  private constructor(sc: SingleChat) {
    this.sc = sc;
    console.log(`DailyChat created with sessionId=${this.sessionId}, persona=${DailyChat.FIXED_PERSONA_NAME}, memory enabled=${true}`);
  }

  static async create(options?: DailyChatOptions): Promise<DailyChat> {
    // simple system prompt can be passed via options.prompt or default
    const realRequirements = options?.requirements || '请简要回答';
    const personaPrompt = `信心十足的教育家`
    const prompt = await getPromptWithArgs(KEY_DAILY_CHAT, { requirements: realRequirements, personaPrompt });
    const modelConfig = options?.modelName ? modelConfigManager.getModelConfig(options.modelName) : modelConfigManager.getDefaultModel();
    const llm = modelConfig ? createLLM(modelConfig) : undefined;

    const sc = new SingleChat({
      prompt,
      enableMemory: true,
      tools: options?.tools,
      llm,
      reasoning: options?.reasoning,
    });
    return new DailyChat(sc);
  }

  /**
   * Send a chat message and get the final response text.
   */
  async chat(userInput: string): Promise<string> {
    try {
      console.log(`DailyChat.chat [${this.sessionId}] request:`, userInput);
      const reply = await this.sc.chat(userInput);
      console.log(`DailyChat.chat [${this.sessionId}] reply:`, reply);
      return reply;
    } catch (err) {
      console.error('DailyChat.chat error:', err);
      throw err;
    }
  }

  /**
   * Stream the agent's intermediate outputs as a Node Readable stream.
   * This mirrors the approach used in `learning_assistant.chatStream`.
   */
  stream(userInput: string, options?: Record<string, any>): Readable {
    console.log(`DailyChat.stream [${this.sessionId}] request:`, userInput);

    const readable = new Readable({
      async read() {
        // no-op; we push data asynchronously
      }
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
              console.log(`[DailyChat] Chunk ${chunkIndex} structure:`, JSON.stringify(chunk).substring(0, 200));
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
              console.log(`[DailyChat] Pushed content (${content.length} chars)`);
            }
          } catch (chunkErr) {
            console.warn(`Chunk ${chunkIndex} 处理错误:`, chunkErr);
            continue;
          }
        }

        // If the stream produced nothing, fallback to chat()
        if (!fullResponse) {
          console.warn('流式处理未产生结果，回退到普通模式');
          const response = await this.chat(userInput);
          readable.push(response);
        }

        // mark end of stream
        readable.push(null);
      } catch (err) {
        console.error('流式对话处理失败:', err);
        // fallback to chat
        try {
          console.log('回退到普通聊天模式...');
          const response = await this.chat(userInput);
          readable.push(response);
          readable.push(null);
        } catch (fallbackErr) {
          const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          readable.destroy(new Error(`流式对话处理失败: ${errorMessage}`));
        }
      }
    })();

    return readable;
  }

  /**
   * Clean up internal resources (delegate to SingleChat.cleanup)
   */
  async cleanup(): Promise<void> {
    try {
      await this.sc.cleanup();
      console.log(`DailyChat cleaned up session=${this.sessionId}`);
    } catch (err) {
      console.warn('DailyChat.cleanup error:', err);
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

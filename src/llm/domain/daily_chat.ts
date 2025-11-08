import SingleChat from '../agent/single_chat';
import { Readable } from 'stream';

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

  constructor(options?: any) {
    // simple system prompt can be passed via options.prompt or default
    const prompt = options?.prompt || '你是一个友好的学习助理，简短回答用户问题。';

    this.sc = new SingleChat({ prompt, enableMemory: true, tools: options?.tools });
    console.log(`DailyChat created with sessionId=${this.sessionId}, memory enabled=${true}`);
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

            // Support a few chunk shapes: string, {content}, or array of messages
            if (typeof chunk === 'string') {
              content = chunk;
            } else if (Array.isArray(chunk) && chunk.length > 0 && typeof chunk[0]?.content === 'string') {
              content = chunk[0].content;
            } else if (chunk && typeof chunk.content === 'string') {
              content = chunk.content;
            }

            if (content) {
              fullResponse += content;
              readable.push(content);
            } else {
              if (chunkIndex <= 10) {
                console.log(`Chunk ${chunkIndex}: 无内容`);
              }
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

export default DailyChat;

import logger from '../../utils/logger';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
import type { LanguageModelLike } from '@langchain/core/language_models/base';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent, type CreateReactAgentParams } from '@langchain/langgraph/prebuilt';
import { PersistentStorage } from '../storage/persistent_storage';
import { isAPIKeyEmpty } from '../utils/modelConfigManager';

/** ReactAgent 构造参数 */
export type ReactAgentOptions = {
  /**
   * Chat model instance compatible with OpenAI-style tool calling.
   */
  llm: LanguageModelLike;
  /**
   * Optional system prompt or runnable used to prime the agent before it plans.
   */
  prompt?: CreateReactAgentParams['prompt'];
  /**
   * Optional set of tools to expose. Defaults to none.
   */
  tools?: CreateReactAgentParams['tools'];
  /**
   * Checkpoint saver instance controlling how long-term memory is stored. Defaults to {@link MemorySaver}.
   */
  checkpointSaver?: CreateReactAgentParams['checkpointSaver'];
  /**
   * Optional alias for {@link checkpointSaver}. If omitted, falls back to the resolved checkpoint saver.
   */
  checkpointer?: CreateReactAgentParams['checkpointer'];
  /**
   * Optional shared store used when persisting memory across threads or processes.
   */
  store?: CreateReactAgentParams['store'];
  /**
   * Default thread identifier applied to invocations when one is not provided explicitly.
   */
  defaultThreadId?: string;
  /**
   * Optional PostgreSQL persistent storage instance for advanced features.
   */
  persistentStorage?: PersistentStorage;
};

type ReactAgentGraph = ReturnType<typeof createReactAgent>;
type InvokeOptions = Parameters<ReactAgentGraph['invoke']>[1];
type StreamOptions = Parameters<ReactAgentGraph['stream']>[1];
type InvokeReturn = Awaited<ReturnType<ReactAgentGraph['invoke']>>;

/** LangGraph ReactAgent 输出状态类型 */
export type ReactAgentState = InvokeReturn;

/**
 * 对 LangGraph 预构建 ReactAgent 的轻量封装
 * 统一管理对话、流式输出、线程和持久化存储
 */
export class ReactAgent {
  private readonly graph: ReactAgentGraph;
  private readonly defaultThreadId?: string;
  private readonly persistentStorage?: PersistentStorage;

  constructor(options: ReactAgentOptions) {
    const { llm, prompt, tools, checkpointSaver, checkpointer, store, defaultThreadId, persistentStorage } = options;

    // 优先使用 checkpointSaver/checkpointer，否则默认 MemorySaver
    let resolvedSaver = checkpointSaver ?? checkpointer;
    // if (!resolvedSaver) {
    //   resolvedSaver = new MemorySaver();
    // }

    this.graph = createReactAgent({
      llm,
      tools: tools ?? [],
      prompt,
      checkpointSaver: resolvedSaver,
      store,
    });

    this.defaultThreadId = defaultThreadId;
    this.persistentStorage = persistentStorage;
  }

  /** 执行 Agent 完整调用，返回最终 LangGraph 状态 */
  async invoke(messages: BaseMessageLike[], options?: InvokeOptions): Promise<ReactAgentState> {
    return this.graph.invoke({ messages }, this.applyThreadConfig(options as Record<string, unknown> | undefined) as InvokeOptions | undefined);
  }

  /** 流式输出 Agent 推理过程中的中间状态更新 */
  stream(messages: BaseMessageLike[], options?: StreamOptions) {
    if (isAPIKeyEmpty) {
      const fallbackChunk = [{ content: '请先参考使用手册配置大模型，以使用语言模型服务' }];
      return Promise.resolve(
        (async function* () {
          yield fallbackChunk;
        })(),
      );
    }
    const mergedOptions = {
      ...(options ?? {}),
      streamMode: (options as Record<string, unknown> | undefined)?.streamMode ?? 'messages',
    } as StreamOptions | undefined;

    // 限制输入上限为 96k tokens (粗略使用字符串长度估算)
    const MAX_TOKENS = 96000;
    let truncatedMessages = messages;

    // 计算总长度
    let totalLength = 0;
    for (const msg of messages) {
      const content = messageContentToString(msg as BaseMessage);
      totalLength += content.length;
    }

    // 如果超出上限，从最后一条消息开始反向截取
    if (totalLength > MAX_TOKENS) {
      logger.warn(`Input length ${totalLength} exceeds ${MAX_TOKENS} tokens, truncating from end...`);
      truncatedMessages = [];
      let currentLength = 0;

      // 从后往前遍历消息
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]!;
        const content = messageContentToString(msg as BaseMessage);
        const msgLength = content.length;

        if (currentLength + msgLength <= MAX_TOKENS) {
          truncatedMessages.unshift(msg);
          currentLength += msgLength;
        } else {
          // 已经达到上限，停止添加
          break;
        }
      }

      logger.debug(`Truncated messages from ${messages.length} to ${truncatedMessages.length} (${currentLength} tokens)`);
    }

    const baseStreamPromise = this.graph.stream(
      { messages: truncatedMessages },
      this.applyThreadConfig(mergedOptions as Record<string, unknown> | undefined) as StreamOptions | undefined,
    );

    return baseStreamPromise.then(async (rawStream: AsyncIterable<unknown>) => {
      async function* filteredStream() {
        for await (const chunk of rawStream as AsyncIterable<any>) {
          if (Array.isArray(chunk)) {
            const filtered = chunk.filter(entry => shouldEmitStreamEntry(entry));
            if (filtered.length === 0) {
              continue;
            }
            yield filtered;
            continue;
          }
          yield chunk;
        }
      }

      return filteredStream();
    });
  }

  /** 运行 Agent 并提取最后一条 AI 消息为纯文本 */
  async runToText(messages: BaseMessageLike[], options?: InvokeOptions): Promise<string> {
    const state = await this.invoke(messages, options);
    const last = state.messages[state.messages.length - 1];
    return last ? messageContentToString(last) : '';
  }

  /** 发送用户消息并返回模型文本回复，自动维护对话历史 */
  async chat(userInput: string, options?: InvokeOptions): Promise<string> {
    if (isAPIKeyEmpty) {
      return '请先参考使用手册配置大模型，以使用语言模型服务。';
    }

    // Get current conversation state to build upon existing messages
    const threadId = (options as Record<string, any> | undefined)?.configurable?.thread_id;
    let existingMessages: BaseMessageLike[] = [];

    if (threadId) {
      try {
        // Try to get existing state for this thread
        const currentState = await this.graph.getState({
          configurable: { thread_id: threadId },
        });
        existingMessages = currentState?.values?.messages ?? [];
      } catch (error) {
        // If no existing state, start with empty messages
        logger.debug(`[ReactAgent.chat] 获取线程 ${threadId} 已有状态失败，使用空历史:`, error);
        existingMessages = [];
      }
    }

    // Add the new user message to existing conversation
    const allMessages = [...existingMessages, new HumanMessage(userInput)];

    const responseState = await this.invoke(allMessages, options);

    const aiMessage = responseState.messages.at(-1);
    const response = aiMessage ? messageContentToString(aiMessage) : '';

    // Update analytics if persistent storage is available
    if (this.persistentStorage && threadId) {
      await this.updateAnalytics(threadId, responseState.messages);
    }

    return response;
  }

  /** 创建新的对话线程并返回线程 ID */
  createNewThread(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /** 获取指定线程的对话历史 */
  async getConversationHistory(threadId?: string): Promise<BaseMessage[]> {
    const resolvedThreadId = threadId ?? this.defaultThreadId;
    if (!resolvedThreadId) {
      logger.debug(`[ReactAgent] No thread ID provided or defaulted; returning empty history.`);
      return [];
    }

    try {
      const currentState = await this.graph.getState({
        configurable: { thread_id: resolvedThreadId },
      });
      return currentState?.values?.messages ?? [];
    } catch (error) {
      logger.warn(`[ReactAgent.getConversationHistory] 获取线程 ${resolvedThreadId} 对话历史失败:`, error);
      return [];
    }
  }

  /** 映射用户 ID 到线程 ID */
  async mapUserToThread(userId: string, threadId?: string, metadata?: any): Promise<string> {
    const finalThreadId = threadId || this.createNewThread();

    if (this.persistentStorage) {
      await this.persistentStorage.mapUserToThread(userId, finalThreadId, metadata);
    }

    return finalThreadId;
  }

  /** 获取用户的所有线程 */
  async getUserThreads(userId: string): Promise<Array<{ threadId: string; createdAt: Date; updatedAt: Date; metadata?: any }>> {
    if (!this.persistentStorage) {
      throw new Error('Persistent storage not available');
    }

    return this.persistentStorage.getUserThreads(userId);
  }

  /** 获取线程的对话分析数据 */
  async getThreadAnalytics(threadId: string): Promise<any> {
    if (!this.persistentStorage) {
      throw new Error('Persistent storage not available');
    }
    return this.persistentStorage.getConversationAnalytics(threadId, threadId);
  }

  /** 清理过期会话 */
  async cleanupExpiredSessions(daysOld: number = 30): Promise<number> {
    if (!this.persistentStorage) {
      throw new Error('Persistent storage not available');
    }

    return this.persistentStorage.cleanupExpiredSessions(daysOld);
  }

  /** 获取持久化存储实例 */
  getPersistentStorage(): PersistentStorage | undefined {
    return this.persistentStorage;
  }

  // 更新对话分析数据
  private async updateAnalytics(threadId: string, messages: BaseMessage[]): Promise<void> {
    if (!this.persistentStorage) {
      return;
    }

    const userMessages = messages.filter(msg => msg._getType() === 'human').length;
    const aiMessages = messages.filter(msg => msg._getType() === 'ai').length;
    const totalMessages = messages.length;
    try {
      await this.persistentStorage.updateConversationAnalytics(
        threadId, // sessionId
        threadId, // userId（实际应传真实 userId）
        '', // conversationSummary
        { totalMessages, userMessages, aiMessages }, // analyticsData
      );
    } catch (error) {
      logger.warn('Failed to update conversation analytics:', error);
    }
  }

  private applyThreadConfig(options?: Record<string, unknown>) {
    if (!this.defaultThreadId) {
      return options;
    }

    const baseOptions = (options ?? {}) as Record<string, any>;
    const merged = {
      ...baseOptions,
      configurable: {
        ...(baseOptions.configurable ?? {}),
        thread_id: baseOptions.configurable?.thread_id ?? this.defaultThreadId,
      },
    };

    return merged;
  }
}

function messageContentToString(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map(chunk => {
        if (typeof chunk === 'string') {
          return chunk;
        }
        if (chunk && typeof chunk === 'object') {
          if ('text' in chunk && typeof chunk.text === 'string') {
            return chunk.text;
          }
          if ('value' in chunk && typeof chunk.value === 'string') {
            return chunk.value;
          }
        }
        return '';
      })
      .join('')
      .trim();
  }

  return '';
}

function shouldEmitStreamEntry(entry: unknown): entry is BaseMessage {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const message = entry as BaseMessage & {
    additional_kwargs?: Record<string, unknown>;
    _getType?: () => string;
  };

  const messageType = typeof message._getType === 'function' ? message._getType() : (message as unknown as { type?: string }).type;

  if (messageType === 'tool' || messageType === 'function') {
    return false;
  }

  const additionalKwargs = (message as any).additional_kwargs;
  if (additionalKwargs && Array.isArray(additionalKwargs.tool_calls) && additionalKwargs.tool_calls.length > 0) {
    return false;
  }

  const textContent = messageContentToString(message);
  return textContent.length > 0;
}

export default ReactAgent;

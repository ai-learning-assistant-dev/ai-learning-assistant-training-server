import logger from '../../utils/logger';
import { HumanMessage } from '@langchain/core/messages';
import type { BaseMessageLike } from '@langchain/core/messages';
import ReactAgent, { type ReactAgentOptions } from './react_agent_base';
import { createLLM } from '../utils/create_llm';
import { MemorySaver } from '@langchain/langgraph';
import { modelConfigManager } from '../utils/modelConfigManager';
import type { LanguageModelLike } from '@langchain/core/language_models/base';

export type SingleChatOptions = {
  llm?: LanguageModelLike;
  prompt?: any;
  tools?: any[];
  enableMemory?: boolean;
  reasoning?: boolean;
  threadId?: string;
};

var memorySaver = new MemorySaver();

/**
 * 轻量一次性对话封装，基于 ReactAgent
 * 适用于无持久记忆的一次性 LLM 调用，使用后需调用 cleanup 释放资源
 */
export class SingleChat {
  private agent: ReactAgent;
  private threadId?: string;
  private readonly reasoningEnabled: boolean;

  constructor(options?: SingleChatOptions) {
    const llm = options?.llm ?? createLLM(modelConfigManager.getDefaultModel());
    this.reasoningEnabled = options?.reasoning ?? true;

    const agentOpts: ReactAgentOptions = {
      llm,
      prompt: options?.prompt,
      tools: options?.tools ?? [],
      defaultThreadId: options?.threadId ?? undefined,
      checkpointSaver: options?.enableMemory ? memorySaver : undefined,
    };

    this.agent = new ReactAgent(agentOpts);
    this.threadId = options?.threadId;
  }

  /** 发送用户消息并返回模型文本回复 */
  async chat(userInput: string): Promise<string> {
    return this.agent.chat(userInput);
  }

  /** 流式输出 Agent 推理过程，返回异步迭代器 */
  async stream(userInput: string, options?: Record<string, any>) {
    // 获取当前对话历史
    const existingMessages = await this.agent.getConversationHistory(this.threadId);
    logger.debug(`[thread ${this.threadId}] SingleChat.stream ${existingMessages.length} existingMessages`);
    // 添加新的用户消息
    const { HumanMessage } = await import('@langchain/core/messages');
    const allMessages = [...existingMessages, new HumanMessage(userInput)];
    return this.agent.stream(allMessages, options);
  }

  /** 便捷封装：调用 Agent 并返回最终状态 */
  async invoke(messages: BaseMessageLike[], options?: Record<string, any>) {
    return (this.agent as any).invoke(messages, { ...(options ?? {}), configurable: { ...(options?.configurable ?? {}), thread_id: this.threadId } } as any);
  }

  /** 清理内部资源，调用后实例不应再使用 */
  async cleanup(): Promise<void> {
    try {
      (this.agent as any) = undefined as any;
    } catch (err) {
      // ignore
    }
  }
}
export default SingleChat;

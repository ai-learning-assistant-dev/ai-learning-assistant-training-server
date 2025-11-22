import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessageLike } from "@langchain/core/messages";
import ReactAgent, { ReactAgentOptions } from "./react_agent_base";
import { createLLM } from "../utils/create_llm";
import { MemorySaver } from "@langchain/langgraph";
import e from "express";
import { modelConfigManager } from "../utils/modelConfigManager";
import { LanguageModelLike } from "@langchain/core/language_models/base";

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
 * SingleChat: a lightweight disposable chat wrapper around ReactAgent.
 *
 * - Intended for one-off LLM calls without durable memory.
 * - Internally creates a new thread id and does not reuse stored history.
 * - Call `cleanup()` when finished to allow GC of internal resources.
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

  /**
   * Send a single user message and return the model's textual reply.
   * Uses ReactAgent's built-in conversation history management.
   */
  async chat(userInput: string): Promise<string> {
    return this.agent.chat(userInput);
  }

  /**
   * Stream intermediate updates as the agent reasons. Returns an async iterable (from ReactAgent.stream).
   */
  async stream(userInput: string, options?: Record<string, any>) {
    // 获取当前对话历史
    const existingMessages = await this.agent.getConversationHistory(this.threadId);
    console.log(`[thread ${this.threadId}] SingleChat.stream ${existingMessages.length} existingMessages`);
    // 添加新的用户消息
    const { HumanMessage } = await import("@langchain/core/messages");
    const allMessages = [...existingMessages, new HumanMessage(userInput)];
    return this.agent.stream(allMessages, options);
  }

  /**
   * Convenience wrapper that invokes the agent and returns the final state.
   */
  async invoke(messages: BaseMessageLike[], options?: Record<string, any>) {
    return (this.agent as any).invoke(messages, { ...(options ?? {}), configurable: { ...(options?.configurable ?? {}), thread_id: this.threadId } } as any);
  }

  /**
   * Clean up internal resources. After calling this the instance should not be used.
   */
  async cleanup(): Promise<void> {
    try {
      (this.agent as any) = undefined as any;
    } catch (err) {
      // ignore
    }
  }
}
export default SingleChat;

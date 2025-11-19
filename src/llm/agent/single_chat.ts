import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessageLike } from "@langchain/core/messages";
import ReactAgent from "./react_agent_base";
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
};

/**
 * SingleChat: a lightweight disposable chat wrapper around ReactAgent.
 *
 * - Intended for one-off LLM calls without durable memory.
 * - Internally creates a new thread id and does not reuse stored history.
 * - Call `cleanup()` when finished to allow GC of internal resources.
 */
export class SingleChat {
  private agent: ReactAgent;
  private threadId: string;

  constructor(options?: SingleChatOptions) {
    const llm = options?.llm ?? createLLM(modelConfigManager.getDefaultModel());

    const agentOpts: any = {
      llm,
      prompt: options?.prompt,
      tools: options?.tools ?? [],
      defaultThreadId: undefined,
      checkpointSaver: options?.enableMemory ? new MemorySaver() : undefined,
    };

    this.agent = new ReactAgent(agentOpts as any);
    this.threadId = (this.agent as any).createNewThread();
  }

  /**
   * Send a single user message and return the model's textual reply.
   * This does not persist memory beyond the lifetime of this instance.
   */
  async chat(userInput: string): Promise<string> {
    const msg = new HumanMessage(userInput);
    return (this.agent as any).runToText([msg], { configurable: { thread_id: this.threadId } } as any);
  }

  /**
   * Stream intermediate updates as the agent reasons. Returns an async iterable (from ReactAgent.stream).
   */
  stream(userInput: string, options?: Record<string, any>) {
    const msg = new HumanMessage(userInput);
    const merged = {
      ...(options ?? {}),
      configurable: { ...(options?.configurable ?? {}), thread_id: this.threadId },
    };
    return (this.agent as any).stream([msg] as BaseMessageLike[], merged as any);
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

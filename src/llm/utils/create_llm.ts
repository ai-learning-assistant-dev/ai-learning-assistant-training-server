import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { ChatDeepSeek } from '@langchain/deepseek';
import { ModelConfig } from "./modelConfigManager";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { clone } from "lodash";

// export function createLLM(): ChatOpenAI {
//     const apiKey = process.env.DEEPSEEK_API_KEY;
//     if (!apiKey) {
//         throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
//     }

//     return new ChatOpenAI({
//         apiKey,
//         model: "deepseek-chat",
//         temperature: 0,
//         configuration: {
//             baseURL: process.env.DEEPSEEK_API_BASE ?? "https://api.deepseek.com",
//         },
//     });
// }

/** 启动器注入的域名 */
export const HOST_DOMAIN = 'host.ala.internal';

export function createLLM(modelConfig: ModelConfig): BaseChatModel {
    // 兼容容器内向容器外访问
    modelConfig = clone(modelConfig);
    if(process.env.IN_ALA_DOCKER === 'true'){
        modelConfig.baseUrl = modelConfig.baseUrl.replace('localhost', HOST_DOMAIN).replace('127.0.0.1', HOST_DOMAIN)
    }

    console.log("[createLLM] modelConfig:", JSON.stringify(modelConfig));
    // 根据提供商创建相应的LLM实例
    switch (modelConfig.provider.toLowerCase()) {
        case 'openai':
        case 'azure openai':
        case 'doubao':
            return new ChatOpenAI({
                apiKey: modelConfig.apiKey,
                model: modelConfig.name,
                configuration: {
                    baseURL: modelConfig.baseUrl
                },
                reasoning: {
                    effort: modelConfig.reasoning ? 'high' : 'minimal' // todo: adjust based on config when reasoning is true
                }
            });

        case 'anthropic':
            return new ChatAnthropic({
                anthropicApiKey: modelConfig.apiKey,
                model: modelConfig.name,
                anthropicApiUrl: modelConfig.baseUrl,
                thinking: modelConfig.reasoning ? { type: 'enabled', budget_tokens: 10240 } : { type: 'disabled' } // todo: 设置思考上限
            });

        case 'google':
            var url = modelConfig.baseUrl
            // 弱智第三方平台
            // todo：hook fetch, 在这个url后面添加query ?key=${modelConfig.apiKey}
            if (modelConfig.baseUrl.includes("dmxapi")) {
                url = "https://www.dmxapi.cn"
            }
            // todo: 没看到google的reasoning配置
            return new ChatGoogleGenerativeAI({
                apiKey: modelConfig.apiKey,
                model: modelConfig.name,
                baseUrl: url,
            });

        case 'ollama':
            return new ChatOllama({
                baseUrl: modelConfig.baseUrl,
                model: modelConfig.name,
                think: modelConfig.reasoning ? true : false
            });

        case 'deepseek':
            return new ChatDeepSeek({
                apiKey: modelConfig.apiKey,
                model: modelConfig.name,
                configuration: {
                    baseURL: modelConfig.baseUrl
                },
                reasoning: {
                    effort: modelConfig.reasoning ? 'high' : 'minimal' // todo: adjust based on config when reasoning is true
                }
            });

        case 'lm-studio':
        case '3rd party (openai-format)':
        default:
            // 对于其他提供商，尝试通用的 OpenAI 格式
            return new ChatOpenAI({
                model: modelConfig.name,
                temperature: 0,
                maxTokens: undefined,
                timeout: undefined,
                maxRetries: 2,
                configuration: {
                    apiKey: modelConfig.apiKey,
                    baseURL: modelConfig.baseUrl
                },
                reasoning: {
                    effort: modelConfig.reasoning ? 'high' : 'minimal' // todo: adjust based on config when reasoning is true
                }
            });
    }
}
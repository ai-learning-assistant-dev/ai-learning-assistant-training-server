import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { ChatDeepSeek } from '@langchain/deepseek';
import { ModelConfig } from "./modelConfigManager";


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

export function createLLM(modelConfig: ModelConfig): any {
    // 根据提供商创建相应的LLM实例
    switch (modelConfig.provider.toLowerCase()) {
        case 'openai':
        case 'azure openai':
            return new ChatOpenAI({
                apiKey: modelConfig.apiKey,
                model: modelConfig.name,
                configuration: {
                    baseURL: modelConfig.baseUrl
                }
            });
            
        case 'anthropic':
            return new ChatAnthropic({
                anthropicApiKey: modelConfig.apiKey,
                model: modelConfig.name,
                anthropicApiUrl: modelConfig.baseUrl
            });
            
        case 'google':
            return new ChatGoogleGenerativeAI({
                apiKey: modelConfig.apiKey,
                model: modelConfig.name
            });
            
        case 'ollama':
            return new ChatOllama({
                baseUrl: modelConfig.baseUrl,
                model: modelConfig.name
            });
        
        case 'deepseek':
            return new ChatDeepSeek({
                apiKey: modelConfig.apiKey,
                model: modelConfig.name,
                configuration: {
                    baseURL: modelConfig.baseUrl
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
                }
            });
    }
}
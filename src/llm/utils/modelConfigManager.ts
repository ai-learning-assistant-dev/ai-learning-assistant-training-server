import * as fs from 'fs';
import * as path from 'path';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  displayName?: string;
  isEmbeddingModel?: boolean;
  reasoning?: boolean;
}

export class ModelConfigManager {
  private configPath: string;
  private configs: ModelConfig[] = [];

  constructor() {
    // 使用项目中的配置文件
    this.configPath = path.join(process.cwd(), '/src/config/llm-config.json');
    console.log('Config path:', this.configPath);
    this.loadConfigs();
  }

  private loadConfigs(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configFile = fs.readFileSync(this.configPath, 'utf8');
        const configData = JSON.parse(configFile);
        this.configs = configData.models || [];
      } else {
        console.warn(`Config file not found at ${this.configPath}`);
      }
    } catch (error) {
      console.error('Failed to load model configs:', error);
    }
  }

  public getModelConfig(name?: string): ModelConfig | null {
    // 如果提供了name，查找对应配置
    if (name) {
      const config = this.configs.find(m => m.name === name);
      if (config) {
        return config;
      }
    }

    // 返回第一个可用的非嵌入模型
    const firstNonEmbeddingModel = this.configs.find(m => !m.isEmbeddingModel);
    return firstNonEmbeddingModel || null;
  }

  public getAllModels(): ModelConfig[] {
    return this.configs;
  }

  public getNonEmbeddingModels(): ModelConfig[] {
    return this.configs.filter(m => !m.isEmbeddingModel);
  }

  public getDefaultModel(): ModelConfig {
    // 获取默认模型配置
    const defaultModelConfig = modelConfigManager.getModelConfig();
    const llm = defaultModelConfig ? defaultModelConfig : {
      id: 'default',
      name: 'deepseek-chat',
      provider: 'deepseek',
      baseUrl: process.env.DEEPSEEK_API_BASE ?? "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY || ''
    };
    return llm;
  }
}

// 导出单例实例
export const modelConfigManager = new ModelConfigManager();
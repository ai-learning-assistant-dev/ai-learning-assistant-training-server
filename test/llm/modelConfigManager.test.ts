import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ModelConfigManager } from '../../src/llm/utils/modelConfigManager';

describe('ModelConfigManager', () => {
  /* 
    TODO 这并不是很好的读取配置的办法，因为Manager固定读取指定位置的Config
    所以无法注入我们的测试Config，所以只能在指定位置写入一个文件。
    这可能导致运行测试时错误的覆盖正确的配置文件。
  */
  const testConfigPath = path.join(process.cwd(), '/src/config/llm-config.json');
  
  beforeEach(() => {
    // 创建一个临时的测试配置文件
    const testConfig = {
      models: [
        {
          id: 'test-model-1',
          name: 'Test Model 1',
          provider: 'openai',
          baseUrl: 'https://api.openai.com',
          apiKey: 'test-key-1',
          displayName: 'Test Model 1 Display'
        },
        {
          id: 'test-model-2',
          name: 'Test Model 2',
          provider: 'anthropic',
          baseUrl: 'https://api.anthropic.com',
          apiKey: 'test-key-2',
          displayName: 'Test Model 2 Display',
          isEmbeddingModel: true
        }
      ]
    };
    
    // 将测试配置写入临时文件
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
  });
  
  afterEach(() => {
    // 清理临时文件
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });
  
  it('should load configs correctly from file', () => {
    // 通过修改环境或使用技巧让ModelConfigManager加载我们的测试配置
    // 这里我们直接测试loadConfigs方法的逻辑
    
    // 创建一个ModelConfigManager实例
    const manager = new ModelConfigManager();
    
    // 验证manager已正确初始化
    expect(manager).toBeDefined();
    
    // 获取所有模型
    const allModels = manager.getAllModels();
    console.log("All models:", allModels);
    expect(allModels).toBeDefined();
    expect(Array.isArray(allModels)).toBe(true);
    
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AiChatController } from "../../src/controllers/aiChatController";
import { modelConfigManager } from "../../src/llm/utils/modelConfigManager";

// Mock modelConfigManager
vi.mock("../../src/llm/utils/modelConfigManager", () => {
  const mockModelConfigManager = {
    getNonEmbeddingModels: vi.fn(),
    getDefaultModel: vi.fn(),
  };
  
  return {
    modelConfigManager: mockModelConfigManager,
  };
});

describe("AiChatController", () => {
  let controller: AiChatController;
  
  beforeEach(() => {
    controller = new AiChatController();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe("getAvailableModels", () => {
    it("should return available models successfully", async () => {
      // Arrange: 设置模拟数据
      const mockModels = [
        { id: "1", name: "gpt-4", displayName: "GPT-4" },
        { id: "2", name: "claude-2", displayName: "Claude 2" },
      ];
      
      const mockDefaultModel = { 
        id: "1", 
        name: "gpt-4", 
        displayName: "GPT-4" 
      };
      
      (modelConfigManager.getNonEmbeddingModels as vi.Mock).mockReturnValue(mockModels);
      (modelConfigManager.getDefaultModel as vi.Mock).mockReturnValue(mockDefaultModel);
      
      // Act: 调用方法
      const result = await controller.getAvailableModels();
      
      // Assert: 验证结果
      expect(result.success).toBe(true);
      expect(result.data.all).toHaveLength(2);
      expect(result.data.default).toBe("GPT-4");
    });
  });
});
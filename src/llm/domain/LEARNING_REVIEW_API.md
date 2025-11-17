# 学习总结评语API文档

## 概述

学习总结评语功能用于在学生完成一节课的学习后，基于以下信息生成个性化的学习评语：
- 聊天记录（从最新到最旧，最多96000 tokens）
- 课程大纲（章节的知识点和内容）
- 练习题目和学习成绩

## API端点

### POST /ai-chat/learning-review

生成学习完一节课后的总结评语。

#### 请求参数

```typescript
{
  userId: string;      // 用户ID
  sectionId: string;   // 章节ID
  sessionId: string;   // 学习会话ID
}
```

#### 响应格式

```typescript
{
  code: number;
  message: string;
  data: {
    strengths: string[];        // 表现良好的方面（2-5条）
    weaknesses: string[];       // 需要加强的方面（2-5条）
    recommendations: string[];  // 推荐额外学习的知识点（2-5条）
    overallComment: string;     // 总体评语（100-200字）
  }
}
```

#### 示例请求

```bash
curl -X POST http://localhost:3000/ai-chat/learning-review \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "sectionId": "660e8400-e29b-41d4-a716-446655440001",
    "sessionId": "session_123456"
  }'
```

#### 示例响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "strengths": [
      "积极主动提问，展现出良好的学习态度",
      "能够准确理解基础概念",
      "练习题完成度高，正确率良好"
    ],
    "weaknesses": [
      "对复杂问题的分析深度不够",
      "部分知识点的应用能力需要加强",
      "建议多做综合性练习题"
    ],
    "recommendations": [
      "深入学习群论的抽象代数基础",
      "复习向量空间和线性变换",
      "练习更多实际应用场景的问题"
    ],
    "overallComment": "你在本节课的学习中表现出色，基础知识掌握扎实。建议在理解的基础上多做练习，特别是综合应用题，以提升问题解决能力。继续保持这种学习热情，相信你会取得更大的进步！"
  }
}
```

## 实现细节

### 1. 数据收集

- **课程大纲**：从 `sections` 表获取章节的 `knowledge_points` 和 `knowledge_content`
- **练习题目**：从 `exercises` 表获取该章节的所有练习题
- **学习成绩**：从 `exercise_results` 表获取用户的答题记录和得分
- **聊天记录**：从 `ai_interactions` 表获取该会话的所有对话记录

### 2. Token限制处理

系统会从最新的聊天记录开始往前拼接，直到达到96000 token的上下文限制。Token估算规则：
- 中文字符：约1.5 tokens/字
- 英文单词：约1.3 tokens/词
- 其他字符：约0.5 tokens/字符

系统会为课程大纲、题目和系统提示预留20000 tokens，剩余空间用于聊天记录。

### 3. 评价维度

AI评估会从以下维度分析学生表现：
- **知识点掌握程度**：根据练习题完成情况
- **学习态度和主动性**：根据聊天记录中的提问质量和频率
- **理解深度**：根据对话中的思考深度
- **答题准确性**：根据练习成绩

### 4. 实现架构

```
Controller (aiChatController.ts)
    ↓
Domain (learning_review_evaluator.ts)
    ↓
SingleChat (使用一次性LLM调用)
    ↓
LLM API (DeepSeek或其他配置的模型)
```

## 使用场景

1. **课程结束总结**：学生完成一节课的学习后，系统自动生成学习总结
2. **学习报告**：为学生生成详细的学习报告，包含优势、不足和改进建议
3. **个性化推荐**：根据学习情况推荐额外的学习资源

## 配置

### 环境变量

确保以下环境变量已配置：
- `DEEPSEEK_API_KEY`: DeepSeek API密钥
- `DEEPSEEK_API_BASE`: DeepSeek API基础URL（可选）
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: 数据库连接信息

### Prompt模板

可以在 `system_prompts` 表中自定义 `learning_review` 类型的提示词模板，使用以下占位符：
- `${sectionOutline}`: 课程大纲
- `${exerciseData}`: 练习题目和成绩
- `${chatHistory}`: 聊天记录

## 错误处理

常见错误及解决方案：

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| 缺少必要参数 | 请求缺少userId/sectionId/sessionId | 检查请求参数 |
| 未找到章节 | sectionId不存在 | 验证章节ID是否正确 |
| DataSource未初始化 | 数据库连接失败 | 检查数据库配置和连接 |
| LLM调用失败 | API密钥无效或网络问题 | 检查API配置和网络连接 |

## 性能考虑

- **缓存建议**：可以对同一会话的评语进行缓存，避免重复计算
- **异步处理**：对于大量聊天记录的情况，建议使用异步任务处理
- **Token优化**：可以对聊天记录进行摘要处理，减少token使用

## 未来改进

- [ ] 添加评语缓存机制
- [ ] 支持批量生成多个章节的学习总结
- [ ] 添加评语质量评分功能
- [ ] 支持多语言评语生成
- [ ] 集成学习曲线分析

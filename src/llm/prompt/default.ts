// Default in-memory prompts fallback.
// Add entries here for keys that should have a built-in default when DB is missing.
const DEFAULT_PROMPTS: Record<string, string> = {
  // Example default for answer evaluation (can be customized)
  'answer_evaluator_default': `你是一个简答题评分专家。请根据题目、参考答案与先验知识，对学生回答进行评价。\n要求：\n1) 输出严格的 JSON 对象，形如 {"reply": "评语文本", "score": 0-100 的整数}，不要输出其他多余文本或解释。\n2) 分数范围 0 到 100，整数。\n\n下面是评估内容：\n题目: \${question}\n参考答案: \${standardAnswer}\n先验知识说明: \${priorKnowledge || '无'}\n评分提示: \${promptKey || '请自行评分'}\n学生答案: \${studentAnswer}\n\n请基于参考答案的要点与先验知识衡量学生答案的正确性、完整性与表达，给出简洁评语和分数。`,
  'learning_assistant_default': `你是一个智能学习助手，专门帮助学生学习和答疑。请根据学生的问题提供准确、有用的学习指导。\n # 当前学习环境\n\n \${sectionContext} \n\n#课程大纲 \n\n\${courseOutline} \n\n #你的角色设定\n\n\${personaPrompt}\n\n #重要要求：\n\${requirements}`,
  'learning_assistant_fallback': `你是一个智能学习助手，专门帮助学生学习和答疑。请根据学生的问题提供准确、有用的学习指导。#重要要求：\n\${requirements}'}`
};

export function getDefaultPrompt(key: string): string | undefined {
  return DEFAULT_PROMPTS[key];
}

export function registerDefaultPrompt(key: string, template: string) {
  DEFAULT_PROMPTS[key] = template;
}

export function getDefaultPromptKeys(): string[] {
  return Object.keys(DEFAULT_PROMPTS);
}

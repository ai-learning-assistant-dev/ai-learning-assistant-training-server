/**
 * LLM Agent 与现有数据模型集成示例
 * 
 * 这个文件演示了如何将迁移过来的 LLM 框架与现有的数据库模型无缝集成
 */

import { AppDataSource } from "../../config/database";
import { createLearningAssistant, startNewLearningSession } from "../domain/learning_assistant";
import { User } from "../../models/user";
import { Section } from "../../models/section";
import { AiPersona } from "../../models/aiPersona";
import { AiInteraction } from "../../models/aiInteraction";

/**
 * 演示如何使用集成的学习助手
 */
async function demonstrateIntegratedLearningAssistant() {
  console.log("🚀 开始 LLM Agent 集成演示");

  try {
    // 确保数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ TypeORM 数据库连接已建立");
    }

    // 1. 查找或创建测试数据
    const { user, section, persona } = await setupTestData();

    // 2. 创建学习助手实例
    console.log("\n📚 创建学习助手...");
    const assistant = await createLearningAssistant(
      user.user_id,
      section.section_id,
      persona.persona_id
    );

    console.log(`✅ 学习助手已创建 - 会话ID: ${assistant.getSessionId()}`);

    // 3. 进行对话测试
    console.log("\n💬 开始对话测试...");
    
    const questions = [
      "你好，我想了解这个章节的主要内容是什么？",
      "这个章节的学习目标是什么？",
      "你能给我一些学习建议吗？"
    ];

    for (const question of questions) {
      console.log(`\n👤 用户: ${question}`);
      const response = await assistant.chat(question);
      console.log(`🤖 AI助手: ${response.substring(0, 100)}...`);
    }

    // 4. 查看对话历史
    console.log("\n📝 获取对话历史...");
    const history = await assistant.getConversationHistory();
    console.log(`📊 对话历史包含 ${history.length} 条消息`);

    // 5. 查看会话分析
    console.log("\n📊 获取会话分析...");
    const analytics = await assistant.getSessionAnalytics();
    console.log("会话分析:", analytics);

    // 6. 查看用户学习进度
    console.log("\n🎯 获取用户学习进度...");
    const progress = await assistant.getUserLearningProgress();
    console.log(`用户学习记录数: ${progress.learningRecords.length}`);
    console.log(`用户课程安排数: ${progress.courseSchedules.length}`);

    // 7. 验证数据库中的记录
    console.log("\n🗄️ 验证数据库记录...");
    const aiInteractionRepo = AppDataSource.getRepository(AiInteraction);
    const savedInteractions = await aiInteractionRepo.find({
      where: { session_id: assistant.getSessionId() },
      order: { query_time: 'ASC' }
    });
    
    console.log(`✅ 数据库中已保存 ${savedInteractions.length} 条AI交互记录`);
    
    // 显示保存的交互记录
    savedInteractions.forEach((interaction, index) => {
      console.log(`  ${index + 1}. 用户: ${interaction.user_message.substring(0, 50)}...`);
      console.log(`     AI: ${interaction.ai_response.substring(0, 50)}...`);
      console.log(`     时间: ${interaction.query_time}`);
    });

    // 8. 测试会话恢复
    console.log("\n🔄 测试会话恢复...");
    await assistant.cleanup();
    
    // 使用相同的会话ID恢复会话
    const resumedAssistant = await createLearningAssistant(
      user.user_id,
      section.section_id,
      persona.persona_id,
      assistant.getSessionId()
    );
    
    const resumedHistory = await resumedAssistant.getConversationHistory();
    console.log(`✅ 会话恢复成功，历史记录包含 ${resumedHistory.length} 条消息`);
    
    // 继续对话
    const followUpResponse = await resumedAssistant.chat("谢谢你的帮助！");
    console.log(`🤖 继续对话: ${followUpResponse.substring(0, 100)}...`);

    await resumedAssistant.cleanup();

    console.log("\n🎉 LLM Agent 集成演示完成！");
    console.log("\n📋 集成总结:");
    console.log("✅ LLM Agent 成功集成到现有数据模型");
    console.log("✅ 对话记录自动保存到 AiInteraction 表");
    console.log("✅ 支持会话管理和历史恢复");
    console.log("✅ 与用户、章节、AI人设完美关联");
    console.log("✅ 提供丰富的分析和统计功能");

  } catch (error) {
    console.error("❌ 演示过程中发生错误:", error);
  } finally {
    // 清理资源
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

/**
 * 设置测试数据
 */
async function setupTestData() {
  const userRepo = AppDataSource.getRepository(User);
  const sectionRepo = AppDataSource.getRepository(Section);
  const personaRepo = AppDataSource.getRepository(AiPersona);

  // 查找或创建测试用户
  let user = await userRepo.findOne({ where: { name: "测试用户_LLM" } });
  if (!user) {
    user = userRepo.create({
      name: "测试用户_LLM",
      education_level: "本科",
      learning_ability: "中等",
      goal: "学习AI相关知识",
      level: 1,
      experience: 0
    });
    user = await userRepo.save(user);
    console.log("✅ 创建测试用户:", user.user_id);
  } else {
    console.log("✅ 找到测试用户:", user.user_id);
  }

  // 查找现有章节或创建测试章节
  let section = await sectionRepo.findOne({ 
    where: { title: "AI基础知识_LLM测试" }
  });
  if (!section) {
    // 先尝试查找现有的任何章节
    const sections = await sectionRepo.find({ take: 1 });
    if (sections.length > 0) {
      section = sections[0];
      console.log("✅ 使用现有章节:", section.section_id);
    } else {
      // 如果没有现有章节，需要先创建 Chapter，但这里为了演示简化
      // 我们创建一个不依赖外键约束的测试章节
      console.log("⚠️ 数据库中没有现有章节，跳过需要章节的测试");
      // 创建一个虚拟的章节对象用于演示（使用有效的UUID格式）
      const virtualSection = {
        section_id: "00000000-0000-0000-0000-000000000001",
        title: "虚拟测试章节",
        chapter_id: "00000000-0000-0000-0000-000000000002",
        knowledge_points: "演示用知识点",
        knowledge_content: "这是一个用于演示的虚拟章节",
        estimated_time: 30,
        section_order: 1
      } as any;
      section = virtualSection;
      console.log("✅ 创建虚拟测试章节用于演示:", virtualSection.section_id);
    }
  } else {
    console.log("✅ 找到测试章节:", section.section_id);
  }

  if (!section) {
    throw new Error("无法创建或找到测试章节");
  }

  // 查找或创建测试AI人设
  let persona = await personaRepo.findOne({ 
    where: { name: "友好的学习助手_LLM" }
  });
  if (!persona) {
    persona = personaRepo.create({
      name: "友好的学习助手_LLM",
      prompt: "你是一个友好、耐心的AI学习助手。你的任务是帮助学生理解课程内容，回答问题，并提供个性化的学习建议。请用温暖、鼓励的语气与学生交流。",
      is_default_template: false
    });
    persona = await personaRepo.save(persona);
    console.log("✅ 创建测试AI人设:", persona.persona_id);
  } else {
    console.log("✅ 找到测试AI人设:", persona.persona_id);
  }

  return { user, section, persona };
}

/**
 * 演示现有 AI 交互功能的升级
 */
async function demonstrateUpgradedAIInteraction() {
  console.log("\n🔄 演示现有 AI 交互功能升级");

  try {
    // 确保数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const { user, section, persona } = await setupTestData();

    console.log("\n🚀 使用 LLM Agent");
    const assistant = await createLearningAssistant(
      user.user_id,
      section.section_id,
      persona.persona_id
    );

    const newResponse = await assistant.chat("这是LLM Agent方式的用户消息");
    console.log("✅ 响应:", newResponse.substring(0, 100) + "...");

    const analytics = await assistant.getSessionAnalytics();
    console.log("分析功能:", {
      messageCount: analytics?.messageCount || 0,
      sessionDuration: analytics?.sessionDurationMinutes || 0
    });

    await assistant.cleanup();
  } catch (error) {
    console.error("❌ 升级演示失败:", error);
  }
}

// 主函数
async function main() {
  console.log("🎯 LLM Agent 数据模型集成完整演示\n");
  
  await demonstrateIntegratedLearningAssistant();
  await demonstrateUpgradedAIInteraction();
  
  console.log("\n🏁 演示结束");
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateIntegratedLearningAssistant,
  demonstrateUpgradedAIInteraction,
  main as runIntegrationDemo
};
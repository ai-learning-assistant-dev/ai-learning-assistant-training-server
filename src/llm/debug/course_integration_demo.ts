/**
 * 测试 LearningAssistant 的课程集成功能
 */

import { AppDataSource } from "../../config/database";
import { 
  createLearningAssistant, 
  createCourseAssistant,
  LearningAssistant 
} from "../domain/learning_assistant";
import { Course } from "../../models/course";
import { Chapter } from "../../models/chapter";
import { Section } from "../../models/section";
import { User } from "../../models/user";
import { AiPersona } from "../../models/aiPersona";
import { AiInteraction } from "../../models/aiInteraction";

/**
 * 清理测试会话数据
 */
async function cleanupTestSessions(userId: string) {
  console.log("🧹 清理之前的测试会话数据...");
  
  try {
    // 清理 AI 交互记录
    const aiInteractionRepo = AppDataSource.getRepository(AiInteraction);
    const deleteResult = await aiInteractionRepo
      .createQueryBuilder()
      .delete()
      .where("user_id = :userId", { userId })
      .execute();
    
    console.log(`✅ 已清理 ${deleteResult.affected} 条AI交互记录`);

    // 清理 LangGraph checkpoint 数据 (如果有的话)
    try {
      const checkpointResult = await AppDataSource.query(
        "DELETE FROM checkpoints WHERE thread_id LIKE $1",
        [`session_${userId}_%`]
      );
      console.log(`✅ 已清理 LangGraph checkpoint 数据 (${checkpointResult[1] || 0} 条记录)`);
    } catch (error) {
      // 如果表不存在或查询失败，忽略错误
      console.log("ℹ️  LangGraph checkpoint 数据清理跳过 (表可能不存在)");
    }

    // 清理 checkpoint_writes 表数据 (如果有的话)
    try {
      const writesResult = await AppDataSource.query(
        "DELETE FROM checkpoint_writes WHERE thread_id LIKE $1",
        [`session_${userId}_%`]
      );
      console.log(`✅ 已清理 checkpoint_writes 数据 (${writesResult[1] || 0} 条记录)`);
    } catch (error) {
      console.log("ℹ️  checkpoint_writes 数据清理跳过 (表可能不存在)");
    }
    
  } catch (error) {
    console.log("⚠️  会话数据清理失败:", error instanceof Error ? error.message : error);
  }
}

/**
 * 演示课程集成功能
 */
async function demonstrateCourseIntegration() {
  console.log("🎓 开始课程集成功能演示\n");

  try {
    // 确保数据库连接
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ TypeORM 数据库连接已建立");
    }

    // 1. 查找测试数据
    const { user, course, section } = await setupTestCourseData();

    // 2. 清理之前的测试会话
    await cleanupTestSessions(user.user_id);

    // 3. 测试基于课程创建学习助手
    console.log("\n🤖 测试基于课程创建学习助手...");
    const courseAssistant = await createCourseAssistant(
      user.user_id,
      course.course_id
    );

    // 3. 测试课程大纲功能
    const outline = await courseAssistant.getCourseOutline();
    console.log("课程大纲:");
    console.log(outline);

    // 4. 测试章节上下文功能
    const context = await courseAssistant.getSectionContext();
    console.log("章节上下文:");
    console.log(context);

    // 5. 测试课程相关对话
    console.log("\n💬 测试课程相关对话...");
    const questions = [
      "这门课程的主要内容是什么？",
      "请给我介绍一下当前章节的学习要点",
      "这门课程有哪些章节？"
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n👤 用户第${i + 1}轮: ${question}`);
      
      try {
        const response = await courseAssistant.chat(question);
        console.log(`🤖 AI回复 ${i + 1}: ${response.substring(0, 200)}...`);
      } catch (error) {
        console.log(`❌ 对话 ${i + 1} 失败:`, error instanceof Error ? error.message : error);
      }
    }

    // 6. 测试会话恢复
    console.log("\n🔄 测试会话恢复...");
    const sessionId = courseAssistant.getSessionId();
    await courseAssistant.cleanup();
    
    // 使用相同的会话ID恢复会话
    const resumedAssistant = await createLearningAssistant(
      user.user_id,
      section.section_id,
      undefined, // persona_id 让系统自动从课程中获取
      sessionId  // 传入正确的sessionId参数
    );
    
    const resumedHistory = await resumedAssistant.getConversationHistory();
    console.log(`✅ 会话恢复成功，历史记录包含 ${resumedHistory.length} 条消息`);
    
    // 继续对话
    const followUpResponse = await resumedAssistant.chat("谢谢你的帮助！");
    console.log(`🤖 继续对话: ${followUpResponse.substring(0, 100)}...`);
    // 7. 清理资源
    await courseAssistant.cleanup();

  } catch (error) {
    console.error("❌ 演示过程中发生错误:", error);
  }
}

/**
 * 设置测试课程数据
 */
async function setupTestCourseData() {
  const userRepo = AppDataSource.getRepository(User);
  const courseRepo = AppDataSource.getRepository(Course);
  const chapterRepo = AppDataSource.getRepository(Chapter);
  const sectionRepo = AppDataSource.getRepository(Section);
  const personaRepo = AppDataSource.getRepository(AiPersona);

  // 查找或创建测试用户
  let user = await userRepo.findOne({ where: { name: "课程测试用户" } });
  if (!user) {
    user = userRepo.create({
      name: "课程测试用户",
      education_level: "本科",
      learning_ability: "良好",
      goal: "学习完整课程体系",
      level: 2,
      experience: 100
    });
    user = await userRepo.save(user);
    console.log("✅ 创建测试用户:", user.user_id);
  } else {
    console.log("✅ 找到测试用户:", user.user_id);
  }

  // 查找或创建测试AI人设
  let persona = await personaRepo.findOne({ where: { name: "专业课程导师" } });
  if (!persona) {
    persona = personaRepo.create({
      name: "专业课程导师",
      prompt: "你是一位经验丰富的课程导师，擅长结构化教学和因材施教。你会根据课程大纲和学生的学习进度，提供个性化的学习指导和答疑解惑。",
      is_default_template: false
    });
    persona = await personaRepo.save(persona);
    console.log("✅ 创建测试AI人设:", persona.persona_id);
  } else {
    console.log("✅ 找到测试AI人设:", persona.persona_id);
  }

  // 查找或创建测试课程
  let course = await courseRepo.findOne({ where: { name: "人工智能基础课程" } });
  if (!course) {
    course = courseRepo.create({
      name: "人工智能基础课程",
      description: "全面介绍人工智能的基本概念、算法和应用，适合初学者系统学习AI知识。",
      default_ai_persona_id: persona.persona_id,
      icon_url: "https://example.com/ai-course-icon.png"
    });
    course = await courseRepo.save(course);
    console.log("✅ 创建测试课程:", course.course_id);

    // 创建测试章节
    const chapter1 = chapterRepo.create({
      course_id: course.course_id,
      title: "AI基础概念",
      chapter_order: 1
    });
    const savedChapter1 = await chapterRepo.save(chapter1);

    const chapter2 = chapterRepo.create({
      course_id: course.course_id,
      title: "机器学习入门",
      chapter_order: 2
    });
    const savedChapter2 = await chapterRepo.save(chapter2);

    // 创建测试章节
    const section1 = sectionRepo.create({
      chapter_id: savedChapter1.chapter_id,
      title: "什么是人工智能",
      knowledge_points: "AI定义、发展历史、应用领域",
      knowledge_content: "人工智能（Artificial Intelligence, AI）是计算机科学的一个分支...",
      estimated_time: 45,
      section_order: 1
    });
    await sectionRepo.save(section1);

    const section2 = sectionRepo.create({
      chapter_id: savedChapter1.chapter_id,
      title: "AI的分类和应用",
      knowledge_points: "强AI、弱AI、应用实例",
      knowledge_content: "AI可以分为强人工智能和弱人工智能...",
      estimated_time: 30,
      section_order: 2
    });
    await sectionRepo.save(section2);

    const section3 = sectionRepo.create({
      chapter_id: savedChapter2.chapter_id,
      title: "机器学习基础",
      knowledge_points: "监督学习、无监督学习、强化学习",
      knowledge_content: "机器学习是AI的核心技术之一...",
      estimated_time: 60,
      section_order: 1
    });
    await sectionRepo.save(section3);

    console.log("✅ 创建测试章节和小节");
  } else {
    console.log("✅ 找到测试课程:", course.course_id);
  }

  // 获取第一个章节用于测试
  const sections = await sectionRepo.find({
    relations: ['chapter'],
    where: { chapter: { course_id: course.course_id } },
    order: { section_order: 'ASC' },
    take: 1
  });

  const section = sections[0] || {
    section_id: "00000000-0000-0000-0000-000000000001",
    title: "虚拟测试章节",
  } as any;

  return { user, course, section, persona };
}

/**
 * 主演示函数
 */
async function main() {
  console.log("🎯 LearningAssistant 课程集成功能演示\n");
  
  await demonstrateCourseIntegration();
  
  // 清理资源
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  main().catch(console.error);
}

export { main as runCourseDemo };
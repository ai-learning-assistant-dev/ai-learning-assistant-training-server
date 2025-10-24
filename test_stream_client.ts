/**
 * 流式对话测试客户端
 * 直接调用LearningAssistant的chatStream方法并流式打印结果
 */

import { Readable } from 'stream';
import { createLearningAssistant } from './src/llm/domain/learning_assistant';

/**
 * 从Readable流中读取数据并流式打印到控制台
 */
async function streamToConsole(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    let chunkCount = 0;

    console.log('📡 开始接收流式数据...\n');
    console.log('─'.repeat(70));
    console.log('');

    stream.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      chunkCount++;
      fullResponse += text;
      
      // 实时打印到控制台
      process.stdout.write(text);
    });

    stream.on('end', () => {
      console.log('\n');
      console.log('─'.repeat(70));
      console.log(`\n✅ 流式传输完成！`);
      console.log(`📊 总共接收 ${chunkCount} 个chunk`);
      console.log(`📊 总计 ${fullResponse.length} 个字符\n`);
      resolve(fullResponse);
    });

    stream.on('error', (error) => {
      console.error('\n❌ 流式传输错误:', error);
      reject(error);
    });
  });
}

/**
 * 测试流式对话
 */
async function testStreamChat() {
  console.log('🧪 流式对话测试客户端\n');
  console.log('═'.repeat(70));
  
  try {
    // 测试参数 - 使用数据库中的真实UUID
    const userId = '04cdc3f7-8c08-4231-9719-67e7f523e845';
    const sectionId = '4c4f637b-f088-4000-96d4-384411de2761';
    const message = '你好，请简单介绍一下你自己';
    
    console.log(`\n📋 测试配置:`);
    console.log(`   用户ID: ${userId}`);
    console.log(`   章节ID: ${sectionId}`);
    console.log(`   消息: ${message}\n`);
    console.log('═'.repeat(70));

    // 创建学习助手实例
    console.log('\n🔧 创建学习助手实例...');
    const assistant = await createLearningAssistant(userId, sectionId);
    console.log(`✅ 助手创建成功，会话ID: ${assistant.getSessionId()}\n`);

    // 获取流式响应
    console.log('🚀 发起流式对话请求...\n');
    const stream = assistant.chatStream(message);

    // 流式打印响应
    const fullResponse = await streamToConsole(stream);

    // 清理资源
    console.log('🧹 清理资源...');
    await assistant.cleanup();
    console.log('✅ 清理完成\n');

    console.log('═'.repeat(70));
    console.log('🎉 测试成功完成！\n');

  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * 测试多轮对话
 */
async function testMultiTurnStreamChat() {
  console.log('🧪 多轮流式对话测试\n');
  console.log('═'.repeat(70));
  
  try {
    const userId = '04cdc3f7-8c08-4231-9719-67e7f523e845';
    const sectionId = '4c4f637b-f088-4000-96d4-384411de2761';
    
    console.log(`\n📋 测试配置:`);
    console.log(`   用户ID: ${userId}`);
    console.log(`   章节ID: ${sectionId}\n`);
    console.log('═'.repeat(70));

    // 创建学习助手实例（保持会话）
    console.log('\n🔧 创建学习助手实例...');
    const assistant = await createLearningAssistant(userId, sectionId);
    const sessionId = assistant.getSessionId();
    console.log(`✅ 助手创建成功，会话ID: ${sessionId}\n`);

    // 第一轮对话
    console.log('═'.repeat(70));
    console.log('💬 第一轮对话\n');
    console.log('🙋 用户: 你好');
    const stream1 = assistant.chatStream('你好');
    await streamToConsole(stream1);

    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第二轮对话
    console.log('═'.repeat(70));
    console.log('💬 第二轮对话\n');
    console.log('🙋 用户: 你刚才说了什么？');
    const stream2 = assistant.chatStream('你刚才说了什么？');
    await streamToConsole(stream2);

    // 清理资源
    console.log('🧹 清理资源...');
    await assistant.cleanup();
    console.log('✅ 清理完成\n');

    console.log('═'.repeat(70));
    console.log('🎉 多轮对话测试成功完成！\n');

  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(error);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const testType = process.argv[2] || 'single';

  if (testType === 'multi') {
    await testMultiTurnStreamChat();
  } else {
    await testStreamChat();
  }

  process.exit(0);
}

// 运行测试
main().catch((error) => {
  console.error('程序异常:', error);
  process.exit(1);
});

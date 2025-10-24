/**
 * 获取数据库中的真实section_id和user_id
 */

import { AppDataSource } from './src/config/database';
import { Section } from './src/models/section';
import { User } from './src/models/user';

async function getTestIds() {
  try {
    console.log('连接数据库...');
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    // 获取第一个用户
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ 
      where: {},
      order: { user_id: 'ASC' }
    });

    if (user) {
      console.log('📋 用户信息:');
      console.log(`   ID: ${user.user_id}`);
      console.log(`   姓名: ${user.name || 'N/A'}\n`);
    }

    // 获取第一个章节
    const sectionRepo = AppDataSource.getRepository(Section);
    const section = await sectionRepo.findOne({
      where: {},
      relations: ['chapter', 'chapter.course'],
      order: { section_id: 'ASC' }
    });

    if (section) {
      console.log('📚 章节信息:');
      console.log(`   ID: ${section.section_id}`);
      console.log(`   标题: ${section.title}`);
      console.log(`   章节ID: ${section.chapter_id}`);
      if (section.chapter) {
        console.log(`   章节名: ${section.chapter.title}`);
        if (section.chapter.course) {
          console.log(`   课程: ${section.chapter.course.name}\n`);
        }
      }
    }

    if (!user || !section) {
      console.log('⚠️  数据库中没有找到测试数据');
    } else {
      console.log('✅ 可以使用以下参数进行测试:');
      console.log(`   userId: "${user.user_id}"`);
      console.log(`   sectionId: "${section.section_id}"`);
    }

    await AppDataSource.destroy();

  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

getTestIds();
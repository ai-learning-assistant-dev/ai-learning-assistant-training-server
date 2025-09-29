
import { User } from './user';
import { Title } from './title';
import { LearningRecord } from './learningRecord';
import { DailySummary } from './dailySummary';
import { CourseSchedule } from './courseSchedule';
import { AiInteraction } from './aiInteraction';
import { AppDataSource } from '../config/database';

export {
  User,
  Title,
  LearningRecord,
  DailySummary,
  CourseSchedule,
  AiInteraction
};

// TypeORM 初始化测试数据
export const createInitialData = async (): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const count = await userRepo.count();
    if (count === 0) {
      const user = userRepo.create({
        name: '新用户',
        avatar_url: '',
        education_level: '',
        learning_ability: '',
        goal: '通过AI提升自学能力',
        level: 0,
        experience: 0,
        current_title_id: undefined
      });
      await userRepo.save(user);
      console.log('✅ 初始测试数据创建成功');
    }
  } catch (error) {
    console.error('❌ 初始测试数据创建失败:', error);
  }
};



import sequelize from '../config/database';
import User from './user';

/**
 * 同步数据库表结构
 * 就是用来创建（或同步）所有已定义模型（数据表）的逻辑。它会根据你在 models 目录下定义的所有模型，自动在数据库中创建对应的数据表结构（如果表不存在则创建，已存在则根据参数决定是否更新结构）。
 * force: true 会先删除再重建所有表（慎用，数据会丢失）。
 * force: false（默认）只会创建不存在的表，不会删除已有表。
*/

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force,alter:true });// alter:true model里面表结构调整，数据库原始数据一般会保留
    console.log('✅ 数据库表结构同步成功');
    const count = await User.count(); //如果没有数据，就创建一条初始数据
    if(count==0){
      await createInitialData();
    }
  } catch (error) {
    console.error('❌ 数据库表结构同步失败:', error);
    throw error;
  }
};

// 创建初始测试数据
const createInitialData = async (): Promise<void> => {
  try {
    await User.bulkCreate([
      {
        name: '新用户',
        avatar_url: '',
        education_level: '',
        learning_ability: '',
        goal: '通过AI提升自学能力',
        level: 0,
        experience: 0,
        current_title_id: undefined
      }
    ]);
    console.log('✅ 初始测试数据创建成功');
  } catch (error) {
    console.error('❌ 初始测试数据创建失败:', error);
  }
};



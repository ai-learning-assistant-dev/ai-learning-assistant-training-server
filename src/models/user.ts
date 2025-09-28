import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
* 用户相关类型
*/
interface UserAttributes {
  user_id: number;
  name: string;
  avatar_url?: string;
  education_level?: string;
  learning_ability?: string;
  goal?: string;
  level?: number;
  experience?: number;
  current_title_id?: number;
}

interface UserCreationAttributes extends Omit<UserAttributes, 'user_id'> {}
interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}

const User = sequelize.define<UserInstance>('User', {
  user_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  education_level: {
    type: DataTypes.STRING,
    allowNull: true
  },
  learning_ability: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  goal: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  current_title_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false,
  underscored: true
});

export default User;
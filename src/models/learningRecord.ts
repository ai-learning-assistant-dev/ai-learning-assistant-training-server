import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface LearningRecordAttributes {
  task_id: number;
  plan_id: number;
  user_id: number;
  section_id: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

interface LearningRecordCreationAttributes extends Omit<LearningRecordAttributes, 'task_id'> {}
interface LearningRecordInstance extends Model<LearningRecordAttributes, LearningRecordCreationAttributes>, LearningRecordAttributes {}

const LearningRecord = sequelize.define<LearningRecordInstance>('LearningRecord', {
  task_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  plan_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  section_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'learning_records',
  timestamps: false,
  underscored: true
});

export default LearningRecord;

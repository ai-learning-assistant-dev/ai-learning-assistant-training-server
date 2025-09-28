import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CourseScheduleAttributes {
  plan_id: number;
  user_id: number;
  course_id: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
}

interface CourseScheduleCreationAttributes extends Omit<CourseScheduleAttributes, 'plan_id'> {}
interface CourseScheduleInstance extends Model<CourseScheduleAttributes, CourseScheduleCreationAttributes>, CourseScheduleAttributes {}

const CourseSchedule = sequelize.define<CourseScheduleInstance>('CourseSchedule', {
  plan_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  course_id: {
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
  tableName: 'course_schedule',
  timestamps: false,
  underscored: true
});

export default CourseSchedule;

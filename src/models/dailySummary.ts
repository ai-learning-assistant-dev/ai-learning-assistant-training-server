import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface DailySummaryAttributes {
  summary_id: number;
  user_id: number;
  summary_date: Date;
  content: string;
}

interface DailySummaryCreationAttributes extends Omit<DailySummaryAttributes, 'summary_id'> {}
interface DailySummaryInstance extends Model<DailySummaryAttributes, DailySummaryCreationAttributes>, DailySummaryAttributes {}

const DailySummary = sequelize.define<DailySummaryInstance>('DailySummary', {
  summary_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  summary_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'daily_summaries',
  timestamps: false,
  underscored: true
});

export default DailySummary;

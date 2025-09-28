import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface TitleAttributes {
  title_id: number;
  course_id: number;
  name: string;
  icon_url?: string;
  min_experience_required?: number;
  min_section_required?: number;
  is_default_template?: boolean;
}

interface TitleCreationAttributes extends Omit<TitleAttributes, 'title_id'> {}
interface TitleInstance extends Model<TitleAttributes, TitleCreationAttributes>, TitleAttributes {}

const Title = sequelize.define<TitleInstance>('Title', {
  title_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  min_experience_required: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  min_section_required: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_default_template: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  }
}, {
  tableName: 'titles',
  timestamps: false,
  underscored: true
});

export default Title;

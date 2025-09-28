import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface AiInteractionAttributes {
  interaction_id: number;
  user_id: number;
  section_id: number;
  session_id: string;
  user_message: string;
  ai_response: string;
  query_time?: Date;
  persona_id_in_use?: number;
}

interface AiInteractionCreationAttributes extends Omit<AiInteractionAttributes, 'interaction_id'> {}
interface AiInteractionInstance extends Model<AiInteractionAttributes, AiInteractionCreationAttributes>, AiInteractionAttributes {}

const AiInteraction = sequelize.define<AiInteractionInstance>('AiInteraction', {
  interaction_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  section_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ai_response: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  query_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  persona_id_in_use: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'ai_interactions',
  timestamps: false,
  underscored: true
});

export default AiInteraction;

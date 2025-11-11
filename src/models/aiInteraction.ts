import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity({ name: 'ai_interactions' })
export class AiInteraction {
  @PrimaryGeneratedColumn('uuid')
  interaction_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  section_id!: string;

  @Column({ type: 'varchar', length: 255 })
  session_id!: string;

  @Column({ type: 'text' })
  user_message!: string;

  @Column({ type: 'text' })
  ai_response!: string;

  @Column({ type: 'timestamp', nullable: true })
  query_time?: Date;

  @Column({ type: 'uuid', nullable: true })
  persona_id_in_use?: string;
  // 说明：移除跨数据库的关系映射（User/Section/AiPersona 属于不同数据源）。
  // 如需获取关联名称或标题，请在控制器里通过 MainDataSource 或 UserDataSource 手动查询并拼接。
}

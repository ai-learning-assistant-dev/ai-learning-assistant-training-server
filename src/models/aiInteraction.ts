import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { Section } from './section';
import { AiPersona } from './aiPersona';


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
    // 用户关联（仅模型查找，不生成数据库外键）
  @ManyToOne(() => User, user => user.aiInteractions, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 节关联
  @ManyToOne(() => Section, section => section.aiInteractions, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'section_id' })
  section!: Section;

  // AI人设关联
  @ManyToOne(() => AiPersona, persona => persona.aiInteractions, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'persona_id' })
  persona!: AiPersona;
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'ai_interactions' })
export class AiInteraction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  interaction_id!: number;

  @Column({ type: 'bigint' })
  user_id!: number;

  @Column({ type: 'bigint' })
  section_id!: number;

  @Column({ type: 'varchar', length: 255 })
  session_id!: string;

  @Column({ type: 'text' })
  user_message!: string;

  @Column({ type: 'text' })
  ai_response!: string;

  @Column({ type: 'timestamp', nullable: true })
  query_time?: Date;

  @Column({ type: 'bigint', nullable: true })
  persona_id_in_use?: number;
}

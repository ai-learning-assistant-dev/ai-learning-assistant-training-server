import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'learning_records' })
export class LearningRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  task_id!: number;

  @Column({ type: 'bigint' })
  plan_id!: number;

  @Column({ type: 'bigint' })
  user_id!: number;

  @Column({ type: 'bigint' })
  section_id!: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status?: string;
}

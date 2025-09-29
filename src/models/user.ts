import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DailySummary } from './dailySummary';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  user_id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  education_level?: string;

  @Column({ type: 'text', nullable: true })
  learning_ability?: string;

  @Column({ type: 'text', nullable: true })
  goal?: string;

  @Column({ type: 'int', nullable: true })
  level?: number;

  @Column({ type: 'int', nullable: true })
  experience?: number;

  @Column({ type: 'bigint', nullable: true })
  current_title_id?: number;
  // 用户的每日总结关联
  @OneToMany(() => DailySummary, summary => summary.user)
  dailySummaries!: DailySummary[];
}
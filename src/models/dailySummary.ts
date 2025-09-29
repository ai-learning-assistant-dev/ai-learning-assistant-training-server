import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';

@Entity({ name: 'daily_summaries' })
export class DailySummary {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  summary_id!: number;

  @Column({ type: 'bigint' })
  user_id!: number;

  @Column({ type: 'timestamp' })
  summary_date!: Date;

  @Column({ type: 'text' })
  content!: string;
  // 关联用户
  @ManyToOne(() => User, user => user.dailySummaries)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

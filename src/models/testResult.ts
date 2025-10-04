import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { Test } from './test';

@Entity({ name: 'test_results' })
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  result_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  test_id!: string;

  @ManyToOne(() => Test)
  @JoinColumn({ name: 'test_id' })
  test!: Test;

  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  ai_feedback?: string;
}

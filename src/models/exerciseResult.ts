import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { Exercise } from './exercise';
import { TestResult } from './testResult';

@Entity({ name: 'exercise_results' })
export class ExerciseResult {
  @PrimaryGeneratedColumn('uuid')
  result_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  exercise_id!: string;

  @ManyToOne(() => Exercise)
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise;

  @Column({ type: 'uuid', nullable: true })
  test_result_id?: string;

  @ManyToOne(() => TestResult, { nullable: true })
  @JoinColumn({ name: 'test_result_id' })
  testResult?: TestResult;

  @Column({ type: 'text', nullable: true })
  user_answer?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  ai_feedback?: string;
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'exercise_results' })
export class ExerciseResult {
  @PrimaryGeneratedColumn('uuid')
  result_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  // 跨库关系移除：按 user_id 使用 UserDataSource 手动查用户

  @Column({ type: 'uuid' })
  exercise_id!: string;

  // 跨库关系移除：按 exercise_id 使用 MainDataSource 手动查练习

  @Column({ type: 'uuid', nullable: true })
  test_result_id?: string;

  // 跨库关系移除：按 test_result_id 使用 UserDataSource 手动查测试结果

  @Column({ type: 'text', nullable: true })
  user_answer?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  ai_feedback?: string;
}

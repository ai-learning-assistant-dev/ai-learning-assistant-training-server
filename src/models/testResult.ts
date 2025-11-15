import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'test_results' })
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  result_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  // 跨库关系移除：按 user_id 用 UserDataSource 查询

  @Column({ type: 'uuid' })
  test_id!: string;

  // 跨库关系移除：按 test_id 用 MainDataSource 查询

  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'text', nullable: true })
  ai_feedback?: string;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { CourseSchedule } from './courseSchedule';
import { Section } from './section';


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
    // 用户关联（仅模型查找，不生成数据库外键）
  @ManyToOne(() => User, user => user.learningRecords, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 课程安排关联
  @ManyToOne(() => CourseSchedule, plan => plan.learningRecords, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'plan_id' })
  plan!: CourseSchedule;

  // 节关联
  @ManyToOne(() => Section, section => section.learningRecords, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'section_id' })
  section!: Section;
}

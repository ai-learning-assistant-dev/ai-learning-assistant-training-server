import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DailySummary } from './dailySummary';
import { CourseSchedule } from './courseSchedule';
import { LearningRecord } from './learningRecord';
import { AiInteraction } from './aiInteraction';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
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

  @Column({ type: 'uuid', nullable: true })
  current_title_id?: string;
  // 用户的每日总结关联（仅模型查找，不生成数据库外键）
  @OneToMany(() => DailySummary, summary => summary.user, { createForeignKeyConstraints: false })
  dailySummaries!: DailySummary[];

  // 用户的课程安排关联
  @OneToMany(() => CourseSchedule, schedule => schedule.user, { createForeignKeyConstraints: false })
  courseSchedules!: CourseSchedule[];

  // 用户的学习记录关联
  @OneToMany(() => LearningRecord, record => record.user, { createForeignKeyConstraints: false })
  learningRecords!: LearningRecord[];

  // 用户的AI交互关联
  @OneToMany(() => AiInteraction, ai => ai.user, { createForeignKeyConstraints: false })
  aiInteractions!: AiInteraction[];
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user';
import { Course } from './course';
import { LearningRecord } from './learningRecord';



@Entity({ name: 'course_schedule' })
export class CourseSchedule {
  @PrimaryGeneratedColumn('uuid')
  plan_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status?: string;
    // 用户关联（仅模型查找，不生成数据库外键）
  @ManyToOne(() => User, user => user.courseSchedules, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 课程关联（仅模型查找，不生成数据库外键）
  @ManyToOne(() => Course, course => course.courseSchedules, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

    // 学习记录反向关联
  @OneToMany(() => LearningRecord, record => record.plan, { createForeignKeyConstraints: false })
  learningRecords!: LearningRecord[];
}

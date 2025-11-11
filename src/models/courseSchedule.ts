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
    // 学习记录反向关联
  @OneToMany(() => LearningRecord, record => record.plan, { createForeignKeyConstraints: false })
  learningRecords!: LearningRecord[];
}

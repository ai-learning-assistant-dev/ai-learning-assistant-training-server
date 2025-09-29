import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'course_schedule' })
export class CourseSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  plan_id!: number;

  @Column({ type: 'bigint' })
  user_id!: number;

  @Column({ type: 'bigint' })
  course_id!: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status?: string;
}

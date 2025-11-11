import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AiPersona } from './aiPersona';
import { Chapter } from './chapter';
import { Title } from './title';
import { CourseSchedule } from './courseSchedule';
import { Test } from './test';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  course_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  icon_url?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  default_ai_persona_id?: string;

  @ManyToOne(() => AiPersona, { nullable: true })
  @JoinColumn({ name: 'default_ai_persona_id' })
  defaultAiPersona?: AiPersona;
  // 课程的章节关联
  @OneToMany(() => Chapter, chapter => chapter.course, { createForeignKeyConstraints: false })
  chapters!: Chapter[];

  // 课程的称号关联
  @OneToMany(() => Title, title => title.course, { createForeignKeyConstraints: false })
  titles!: Title[];

  // 课程的课程安排关联
  @OneToMany(() => CourseSchedule, schedule => schedule.course, { createForeignKeyConstraints: false })
  courseSchedules!: CourseSchedule[];

  // 课程的测试关联
  @OneToMany(() => Test, test => test.course, { createForeignKeyConstraints: false })
  tests!: Test[];
}

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

  // 课程分类：职业技能 / 文化基础 / 工具使用 / 人文素养
  @Column({ type: 'varchar', length: 255, nullable: true })
  category!: string;

  @Column({ type: 'text', nullable: true })
  contributors?: string;

  // 课程学时（秒或分钟视项目约定，当前使用分钟，单位：int）
  @Column({ type: 'int', nullable: true })
  total_estimated_time?: number;

  @Column({ type: 'uuid', nullable: true })
  default_ai_persona_id?: string;

  @ManyToOne(() => AiPersona, { nullable: true })
  @JoinColumn({ name: 'default_ai_persona_id' })
  defaultAiPersona?: AiPersona;
  // 课程的章节关联
  @OneToMany(() => Chapter, chapter => chapter.course, { createForeignKeyConstraints: false })
  chapters!: Chapter[];
  // 课程的测试关联
  @OneToMany(() => Test, test => test.course, { createForeignKeyConstraints: false })
  tests!: Test[];
}

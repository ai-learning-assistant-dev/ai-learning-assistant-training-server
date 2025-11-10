import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Chapter } from './chapter';
import { AiInteraction } from './aiInteraction';
import { LearningRecord } from './learningRecord';
import { Exercise } from './exercise';
import { LeadingQuestion } from './leadingQuestion';


@Entity({ name: 'sections' })
export class Section {
  @PrimaryGeneratedColumn('uuid')
  section_id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'uuid' })
  chapter_id!: string;

  @ManyToOne(() => Chapter)
  @JoinColumn({ name: 'chapter_id' })
  chapter!: Chapter;

  @Column({ type: 'varchar', length: 255, nullable: true })
  video_url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  knowledge_points?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  video_subtitles?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  srt_path?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  knowledge_content?: string;

  @Column({ type: 'int', nullable: true })
  estimated_time?: number;

  @Column({ type: 'int' })
  section_order!: number;
    // AI交互反向关联
  @OneToMany(() => AiInteraction, ai => ai.section, { createForeignKeyConstraints: false })
  aiInteractions!: AiInteraction[];

  // 学习记录反向关联
  @OneToMany(() => LearningRecord, record => record.section, { createForeignKeyConstraints: false })
  learningRecords!: LearningRecord[];

  // 习题反向关联
  @OneToMany(() => Exercise, ex => ex.section, { createForeignKeyConstraints: false })
  exercises!: Exercise[];

  // 预设问题反向关联
  @OneToMany(() => LeadingQuestion, q => q.section, { createForeignKeyConstraints: false })
  leadingQuestions!: LeadingQuestion[];
}

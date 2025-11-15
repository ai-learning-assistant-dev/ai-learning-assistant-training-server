import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Chapter } from './chapter';
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

  @Column({ type: 'text',  nullable: true })
  video_url?: string;

  @Column({ type: 'jsonb',  nullable: true })
  knowledge_points?: any;

  @Column({ type: 'jsonb',  nullable: true })
  video_subtitles?: any;

  @Column({ type: 'varchar', length: 512, nullable: true })
  srt_path?: string;

  @Column({ type: 'jsonb',  nullable: true })
  knowledge_content?: any;

  @Column({ type: 'int', nullable: true })
  estimated_time?: number;

  @Column({ type: 'int' })
  section_order!: number;
  // 移除跨数据库反向关联（AiInteraction 属于用户库，Section 属于主库），避免 TypeORM 元数据跨数据源引用
  // 如需获取某节的 AI 交互，使用 UserDataSource.getRepository(AiInteraction).find({ where: { section_id } })

  // 习题反向关联
  @OneToMany(() => Exercise, ex => ex.section, { createForeignKeyConstraints: false })
  exercises!: Exercise[];

  // 预设问题反向关联
  @OneToMany(() => LeadingQuestion, q => q.section, { createForeignKeyConstraints: false })
  leadingQuestions!: LeadingQuestion[];
}

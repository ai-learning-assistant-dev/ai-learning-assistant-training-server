import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course';

@Entity({ name: 'chapters' })
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  chapter_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'int',comment: '0: lock, 1: learning, 2: pass',default:0 ,nullable:true}) //默认为 0 状态，添加时候每个第一章第一节都为learning
  unlocked!: number;

  @Column({ type: 'int' })
  chapter_order!: number;
}

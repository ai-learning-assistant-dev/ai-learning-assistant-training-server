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

  @Column({ type: 'int' })
  chapter_order!: number;
}

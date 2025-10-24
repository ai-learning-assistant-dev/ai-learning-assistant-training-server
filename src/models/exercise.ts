import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Section } from './section';

@Entity({ name: 'exercises' })
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  exercise_id!: string;

  @Column({ type: 'uuid', nullable: true })
  section_id?: string;

  @ManyToOne(() => Section, { nullable: true })
  @JoinColumn({ name: 'section_id' })
  section?: Section;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'varchar', length: 50, comment: '0: 单选, 1: 多选, 2: 简答' })
  type_status!: string;

  @Column({ type: 'int', default: 1 })
  score!: number;

  @Column({ type: 'text' })
  answer!: string;
}

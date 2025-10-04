import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Section } from './section';

@Entity({ name: 'leading_question' })
export class LeadingQuestion {
  @PrimaryGeneratedColumn('uuid')
  question_id!: string;

  @Column({ type: 'uuid' })
  section_id!: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section!: Section;

  @Column({ type: 'text' })
  question!: string;
}

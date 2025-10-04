import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Exercise } from './exercise';

@Entity({ name: 'exercise_options' })
export class ExerciseOption {
  @PrimaryGeneratedColumn('uuid')
  option_id!: string;

  @Column({ type: 'uuid' })
  exercise_id!: string;

  @ManyToOne(() => Exercise)
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise;

  @Column({ type: 'text' })
  option_text!: string;

  @Column({ type: 'boolean' })
  is_correct!: boolean;
}

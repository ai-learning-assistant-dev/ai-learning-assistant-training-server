import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Test } from './test';
import { Exercise } from './exercise';

@Entity({ name: 'test_exercises' })
export class TestExercise {
  @PrimaryColumn({ type: 'uuid' })
  test_id!: string;

  @PrimaryColumn({ type: 'uuid' })
  exercise_id!: string;

  @ManyToOne(() => Test, undefined, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'test_id' })
  test!: Test;

  @ManyToOne(() => Exercise, undefined, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise;
}

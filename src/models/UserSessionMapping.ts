import { Entity, PrimaryGeneratedColumn, Column, OneToMany,CreateDateColumn,UpdateDateColumn } from 'typeorm';
// TypeORM 实体定义
@Entity({ name: 'user_session_mapping' })
export class UserSessionMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  thread_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
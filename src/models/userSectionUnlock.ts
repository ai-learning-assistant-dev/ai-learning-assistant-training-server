import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('user_section_unlock')
@Index(['user_id', 'chapter_id', 'section_id'], { unique: true })
export class UserSectionUnlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  user_id!: string;

  @Column({ type: 'varchar', length: 64 })
  chapter_id!: string;

  @Column({ type: 'varchar', length: 64,nullable:true })
  section_id!: string;

  @Column({ type: 'int', default: 0 })
  unlocked!: number;

  @Column({ type: 'int', default: 0 })
  duration!: number;
}

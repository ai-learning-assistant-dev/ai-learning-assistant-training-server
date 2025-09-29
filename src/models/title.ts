import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'titles' })
export class Title {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  title_id!: number;

  @Column({ type: 'bigint' })
  course_id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon_url?: string;

  @Column({ type: 'int', nullable: true })
  min_experience_required?: number;

  @Column({ type: 'int', nullable: true })
  min_section_required?: number;

  @Column({ type: 'boolean', nullable: true })
  is_default_template?: boolean;
}

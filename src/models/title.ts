import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity({ name: 'titles' })
export class Title {
  @PrimaryGeneratedColumn('uuid')
  title_id!: string;

  @Column({ type: 'uuid' })
  course_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text'})
  icon_url?: string;

  @Column({ type: 'int', nullable: true })
  min_experience_required?: number;

  @Column({ type: 'int', nullable: true })
  min_section_required?: number;

  @Column({ type: 'boolean', nullable: true })
  is_default_template?: boolean;
  // 跨库关联移除（Course/User 在主库或用户库不同数据源），通过手动查询实现。
}

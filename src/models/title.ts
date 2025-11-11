import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Course } from './course';
import { User } from './user';


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
    // 课程关联（仅模型查找，不生成数据库外键）
  @ManyToOne(() => Course, course => course.titles, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'course_id' })
  course!: Course;
    // 用户反向关联（如有用户称号需求）
  @OneToMany(() => User, user => user.current_title_id, { createForeignKeyConstraints: false })
  users!: User[];
}

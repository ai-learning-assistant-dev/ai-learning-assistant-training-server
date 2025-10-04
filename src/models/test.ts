import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Course } from './course';
import { TestResult } from './testResult';


@Entity({ name: 'tests' })
export class Test {
  @PrimaryGeneratedColumn('uuid')
  test_id!: string;

  @Column({ type: 'uuid', nullable: true })
  course_id?: string;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @Column({ type: 'varchar', length: 50 })
  type_status!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

    // 测试结果反向关联
  @OneToMany(() => TestResult, result => result.test, { createForeignKeyConstraints: false })
  testResults!: TestResult[];
}

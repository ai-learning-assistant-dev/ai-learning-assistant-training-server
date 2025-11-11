import { Entity, PrimaryGeneratedColumn, Column,OneToMany } from 'typeorm';
import { AiInteraction } from './aiInteraction';
@Entity({ name: 'ai_personas' })
export class AiPersona {
  @PrimaryGeneratedColumn('uuid')
  persona_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'boolean', default: false })
  is_default_template!: boolean;
      // AI交互反向关联
  // 移除与 AiInteraction 的反向关联（跨库）。使用用户库仓库单独查询。
}

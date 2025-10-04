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
  @OneToMany(() => AiInteraction, ai => ai.persona, { createForeignKeyConstraints: false })
   aiInteractions!: AiInteraction[];
}

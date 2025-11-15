import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'system_prompts' })
export class SystemPrompt {
  // use title as the primary key (no uuid)
  @PrimaryColumn({ type: 'varchar', length: 255 })
  title!: string;

  // long text for the system prompt
  @Column({ type: 'text' })
  prompt_text!: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}

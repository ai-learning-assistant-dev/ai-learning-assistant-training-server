import { MainDataSource } from '../config/database';
import { SystemPrompt } from '../models/systemPrompt';
import { getDefaultPrompt, getDefaultPromptKeys, getAudioPrompt } from '../llm/prompt/default';

export const updateSystemPrompt = async (title: string, prompt_text: string): Promise<SystemPrompt> => {
  const repo = MainDataSource.getRepository(SystemPrompt);
  const existing = await repo.findOne({ where: { title } });
  if (!existing) {
    throw new Error('SystemPrompt not found');
  }
  existing.prompt_text = prompt_text;
  return repo.save(existing);
};

export const getAllSystemPrompts = async (): Promise<SystemPrompt[]> => {
  const repo = MainDataSource.getRepository(SystemPrompt);
  const dbItems = await repo.find({ order: { created_at: 'DESC' } });

  // include defaults that are not present in DB
  const dbTitles = new Set(dbItems.map(i => i.title));
  const defaultKeys = getDefaultPromptKeys();
  for (const key of defaultKeys) {
    if (!dbTitles.has(key)) {
      const tpl = getDefaultPrompt(key)!;
      const fake = new SystemPrompt();
      fake.title = key;
      fake.prompt_text = tpl;
      fake.created_at = new Date();
      fake.updated_at = new Date();
      dbItems.push(fake);
    }
  }

  return dbItems;
};

export const getSystemPromptByTitle = async (title: string): Promise<SystemPrompt | null> => {
  const repo = MainDataSource.getRepository(SystemPrompt);
  const item = await repo.findOne({ where: { title } });
  if (item) return item;
  const def = getDefaultPrompt(title);
  if (def !== undefined) {
    const fake = new SystemPrompt();
    fake.title = title;
    fake.prompt_text = def;
    fake.created_at = new Date();
    fake.updated_at = new Date();
    return fake;
  }
  return null;
};

export const getAllSystemPromptKeys = async (): Promise<string[]> => {
  const repo = MainDataSource.getRepository(SystemPrompt);
  const items = await repo.find({ select: ['title'] as (keyof SystemPrompt)[] });
  const keys = new Set(items.map(i => i.title));
  const defaultKeys = getDefaultPromptKeys();
  for (const k of defaultKeys) keys.add(k);
  return Array.from(keys);
};

/**
 * Get audio communication prompt by option key (e.g., 'DEFAULT', 'TTS_MODEL_1')
 * Returns the prompt from DB if exists, otherwise from default fallback
 */
export const getAudioPromptByOption = async (optionKey: string): Promise<string | null> => {
  // First try to get from database
  const repo = MainDataSource.getRepository(SystemPrompt);
  const dbKey = `audio_communication_${optionKey.toLowerCase()}`;
  const item = await repo.findOne({ where: { title: dbKey } });
  if (item && item.prompt_text) {
    return item.prompt_text;
  }
  
  // Fallback to default
  const defaultPrompt = getAudioPrompt(optionKey);
  return defaultPrompt ?? null;
};


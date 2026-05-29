import { eq, desc } from 'drizzle-orm';
import { mainDb } from '@db/index';
import { systemPrompts } from '@db/main/schema';
import { getDefaultPrompt, getDefaultPromptKeys, getAudioPrompt } from '@llm/prompt/default';

type SystemPromptRow = typeof systemPrompts.$inferSelect;

export const updateSystemPrompt = async (title: string, prompt_text: string): Promise<SystemPromptRow> => {
  const [existing] = await mainDb.select().from(systemPrompts).where(eq(systemPrompts.title, title));

  if (!existing) {
    throw new Error('SystemPrompt not found');
  }

  const [updated] = await mainDb.update(systemPrompts).set({ prompt_text, updated_at: new Date() }).where(eq(systemPrompts.title, title)).returning();

  return updated!;
};

export const getAllSystemPrompts = async (): Promise<SystemPromptRow[]> => {
  const dbItems = await mainDb.select().from(systemPrompts).orderBy(desc(systemPrompts.created_at));

  // include defaults that are not present in DB
  const dbTitles = new Set(dbItems.map(i => i.title));
  const defaultKeys = getDefaultPromptKeys();
  for (const key of defaultKeys) {
    if (!dbTitles.has(key)) {
      const tpl = getDefaultPrompt(key)!;
      dbItems.push({
        title: key,
        prompt_text: tpl,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  return dbItems;
};

export const getSystemPromptByTitle = async (title: string): Promise<SystemPromptRow | null> => {
  const [item] = await mainDb.select().from(systemPrompts).where(eq(systemPrompts.title, title));

  if (item) return item;

  const def = getDefaultPrompt(title);
  if (def !== undefined) {
    return {
      title,
      prompt_text: def,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
  return null;
};

export const getAllSystemPromptKeys = async (): Promise<string[]> => {
  const items = await mainDb.select({ title: systemPrompts.title }).from(systemPrompts);

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
  const dbKey = `audio_communication_${optionKey.toLowerCase()}`;
  const [item] = await mainDb.select().from(systemPrompts).where(eq(systemPrompts.title, dbKey));

  if (item?.prompt_text) {
    return item.prompt_text;
  }

  // Fallback to default
  const defaultPrompt = getAudioPrompt(optionKey);
  return defaultPrompt ?? null;
};

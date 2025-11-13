import { getSystemPromptByTitle, getAudioPromptByOption } from '../../services/systemPromptService';

function getByPath(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let cur: any = obj;
    for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
    }
    return cur;
}

/**
 * Get prompt by key and substitute variables using args
 * @param key - Prompt key (title)
 * @throws Error if prompt not found
 */
export async function getPromptWithArgs(key: string, args: Record<string, any>): Promise<string> {
    // Use service layer which handles DB + default fallback
    const prompt = await getSystemPromptByTitle(key);
    if (!prompt) {
        throw new Error(`SystemPrompt not found for key=${key}`);
    }

    let template = prompt.prompt_text ?? '';

    // replace ${var} and nested ${user.name} using args without evaluating arbitrary code
    const result = template.replace(/\$\{([^}]+)\}/g, (_m, token) => {
        const val = getByPath(args, token.trim());
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    });

    console.log(`[getPromptWithArgs] key=${key}, 拼装后的提示词:\n${result}`);

    return result;
}

/**
 * Get audio communication prompt by option key
 * @param optionKey - Audio option key (e.g., 'DEFAULT', 'TTS_MODEL_1')
 * @param args - Optional template arguments for variable substitution
 * @returns Processed prompt string with variables substituted
 * @throws Error if prompt not found
 */
export async function getAudioPrompt(
    optionKey: string, 
): Promise<string> {
    const result = await getAudioPromptByOption(optionKey);
    if (!result) {
        throw new Error(`Audio prompt not found for optionKey=${optionKey}`);
    }
    return result;
}
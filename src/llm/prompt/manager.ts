import { getSystemPromptByTitle } from '../../services/systemPromptService';

function getByPath(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let cur: any = obj;
    for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
    }
    return cur;
}

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

    return result;
}
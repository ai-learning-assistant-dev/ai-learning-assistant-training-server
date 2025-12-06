export class LLMSettingsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LLMSettingsError";
    }
}
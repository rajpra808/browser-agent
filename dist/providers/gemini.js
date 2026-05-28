"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const base_1 = require("./base");
class GeminiProvider {
    name = 'gemini';
    apiKey;
    model;
    constructor(config) {
        this.apiKey = config.apiKey ?? '';
        this.model = config.model ?? 'gemini-3-flash-preview';
    }
    async decideAction(task, screenshotB64, history, pageUrl) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: base_1.SYSTEM_PROMPT }] },
                contents: [{
                        parts: [
                            { inline_data: { mime_type: 'image/png', data: screenshotB64 } },
                            { text: userMessage },
                        ],
                    }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
            }),
        });
        if (!res.ok)
            throw new Error(`Gemini ${res.status}: ${await res.text()}`);
        const data = await res.json();
        const text = data.candidates[0]?.content?.parts[0]?.text ?? '';
        return (0, base_1.parseAction)(text);
    }
}
exports.GeminiProvider = GeminiProvider;

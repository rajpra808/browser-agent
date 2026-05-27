"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const genai_1 = require("@google/genai");
const base_1 = require("./base");
class GeminiProvider {
    name = 'gemini';
    ai;
    model;
    constructor(config) {
        this.ai = new genai_1.GoogleGenAI({ apiKey: config.apiKey ?? '' });
        this.model = config.model ?? 'gemini-2.0-flash';
    }
    async decideAction(task, screenshotB64, history, pageUrl) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl);
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: screenshotB64 } },
                        { text: userMessage },
                    ],
                },
            ],
            config: {
                systemInstruction: base_1.SYSTEM_PROMPT,
                temperature: 0.1,
                maxOutputTokens: 512,
            },
        });
        const text = response.text ?? '';
        return (0, base_1.parseAction)(text);
    }
}
exports.GeminiProvider = GeminiProvider;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const base_1 = require("./base");
class OllamaProvider {
    name = 'ollama';
    model;
    baseUrl;
    constructor(config) {
        this.model = config.model ?? 'llava:13b';
        this.baseUrl = (config.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    }
    async decideAction(task, screenshotB64, history, pageUrl) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl);
        const body = {
            model: this.model,
            messages: [
                { role: 'system', content: base_1.SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: userMessage,
                    images: [screenshotB64],
                },
            ],
            stream: false,
            options: { temperature: 0.1 },
        };
        const res = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`Ollama ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json());
        return (0, base_1.parseAction)(data.message.content);
    }
}
exports.OllamaProvider = OllamaProvider;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeApiProvider = void 0;
const base_1 = require("./base");
class ClaudeApiProvider {
    name = 'claude-api';
    apiKey;
    model;
    constructor(config) {
        this.apiKey = config.apiKey ?? '';
        this.model = config.model ?? 'claude-sonnet-4-5';
    }
    async decideAction(task, screenshotB64, history, pageUrl) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 2048,
                system: base_1.SYSTEM_PROMPT,
                messages: [{
                        role: 'user',
                        content: [
                            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotB64 } },
                            { type: 'text', text: userMessage },
                        ],
                    }],
            }),
        });
        if (!res.ok)
            throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
        const data = await res.json();
        const text = data.content.find(c => c.type === 'text')?.text ?? '';
        return (0, base_1.parseAction)(text);
    }
}
exports.ClaudeApiProvider = ClaudeApiProvider;

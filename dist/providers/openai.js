"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const base_1 = require("./base");
class OpenAIProvider {
    name = 'openai';
    apiKey;
    model;
    constructor(config) {
        this.apiKey = config.apiKey ?? '';
        this.model = config.model ?? 'gpt-4o-mini';
    }
    async decideAction(task, screenshotB64, history, pageUrl, marks) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl, marks);
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'authorization': `Bearer ${this.apiKey}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 2048,
                temperature: 0.1,
                messages: [
                    { role: 'system', content: base_1.SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotB64}`, detail: 'high' } },
                            { type: 'text', text: userMessage },
                        ],
                    },
                ],
            }),
        });
        if (!res.ok)
            throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
        const data = await res.json();
        const text = data.choices[0]?.message?.content ?? '';
        return (0, base_1.parseAction)(text);
    }
}
exports.OpenAIProvider = OpenAIProvider;

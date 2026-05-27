"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_1 = require("./base");
class OpenAIProvider {
    name = 'openai';
    client;
    model;
    constructor(config) {
        this.client = new openai_1.default({ apiKey: config.apiKey });
        this.model = config.model ?? 'gpt-4o-mini';
    }
    async decideAction(task, screenshotB64, history, pageUrl) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl);
        const response = await this.client.chat.completions.create({
            model: this.model,
            max_tokens: 512,
            temperature: 0.1,
            messages: [
                { role: 'system', content: base_1.SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${screenshotB64}`,
                                detail: 'high',
                            },
                        },
                        { type: 'text', text: userMessage },
                    ],
                },
            ],
        });
        const text = response.choices[0]?.message?.content ?? '';
        return (0, base_1.parseAction)(text);
    }
}
exports.OpenAIProvider = OpenAIProvider;

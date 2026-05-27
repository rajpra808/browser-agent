"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeApiProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const base_1 = require("./base");
class ClaudeApiProvider {
    name = 'claude-api';
    client;
    model;
    constructor(config) {
        this.client = new sdk_1.default({ apiKey: config.apiKey });
        this.model = config.model ?? 'claude-sonnet-4-5';
    }
    async decideAction(task, screenshotB64, history, pageUrl) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl);
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 512,
            system: base_1.SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: { type: 'base64', media_type: 'image/png', data: screenshotB64 },
                        },
                        { type: 'text', text: userMessage },
                    ],
                },
            ],
        });
        const block = response.content.find((c) => c.type === 'text');
        const text = block?.type === 'text' ? block.text : '';
        return (0, base_1.parseAction)(text);
    }
}
exports.ClaudeApiProvider = ClaudeApiProvider;

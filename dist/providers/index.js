"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = createProvider;
const ollama_1 = require("./ollama");
const claude_api_1 = require("./claude-api");
const gemini_1 = require("./gemini");
const openai_1 = require("./openai");
const claude_code_1 = require("./claude-code");
function createProvider(name, config) {
    switch (name) {
        case 'ollama': return new ollama_1.OllamaProvider(config);
        case 'claude-api': return new claude_api_1.ClaudeApiProvider(config);
        case 'gemini': return new gemini_1.GeminiProvider(config);
        case 'openai': return new openai_1.OpenAIProvider(config);
        case 'claude-code': return new claude_code_1.ClaudeCodeProvider(config);
        default:
            throw new Error(`Unknown provider: "${name}". Valid: ollama, claude-api, gemini, openai, claude-code`);
    }
}

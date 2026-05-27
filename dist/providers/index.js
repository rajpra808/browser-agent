"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDERS = exports.PROVIDER_MODELS = void 0;
exports.listModels = listModels;
exports.createProvider = createProvider;
const ollama_1 = require("./ollama");
const claude_api_1 = require("./claude-api");
const gemini_1 = require("./gemini");
const openai_1 = require("./openai");
const claude_code_1 = require("./claude-code");
exports.PROVIDER_MODELS = {
    'claude-api': ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-opus-4-5'],
    'gemini': ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4'],
    'ollama': [], // dynamic — fetched from local API
    'claude-code': [], // uses claude CLI default
};
exports.PROVIDERS = Object.keys(exports.PROVIDER_MODELS);
async function listModels(providerName, baseUrl = 'http://localhost:11434') {
    if (providerName === 'ollama') {
        try {
            const res = await fetch(`${baseUrl}/api/tags`);
            if (!res.ok)
                throw new Error(`Ollama ${res.status}`);
            const data = await res.json();
            return data.models.map(m => m.name);
        }
        catch {
            return ['(Ollama not running — start with: ollama serve)'];
        }
    }
    if (providerName === 'claude-code') {
        return ['(uses the default model configured in your claude CLI)'];
    }
    return exports.PROVIDER_MODELS[providerName] ?? [];
}
function createProvider(name, config) {
    switch (name) {
        case 'ollama': return new ollama_1.OllamaProvider(config);
        case 'claude-api': return new claude_api_1.ClaudeApiProvider(config);
        case 'gemini': return new gemini_1.GeminiProvider(config);
        case 'openai': return new openai_1.OpenAIProvider(config);
        case 'claude-code': return new claude_code_1.ClaudeCodeProvider(config);
        default:
            throw new Error(`Unknown provider: "${name}". Valid: ${exports.PROVIDERS.join(', ')}`);
    }
}

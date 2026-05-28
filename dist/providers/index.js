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
// Fallback list used when no API key is available or the live fetch fails.
exports.PROVIDER_MODELS = {
    'claude-api': ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-opus-4-5'],
    'gemini': ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4'],
    'ollama': [],
    'claude-code': [],
};
exports.PROVIDERS = Object.keys(exports.PROVIDER_MODELS);
async function fetchAnthropic(apiKey) {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=200', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    });
    if (!res.ok)
        throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return data.data.map(m => m.id);
}
async function fetchGemini(apiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`);
    if (!res.ok)
        throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    return data.models
        .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));
}
async function fetchOpenAI(apiKey) {
    const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok)
        throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return data.data.map(m => m.id).filter(id => /^(gpt|o\d|chatgpt)/i.test(id));
}
async function listModels(providerName, opts = {}) {
    const { baseUrl = 'http://localhost:11434', apiKey } = opts;
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
    if (apiKey) {
        try {
            if (providerName === 'claude-api')
                return await fetchAnthropic(apiKey);
            if (providerName === 'gemini')
                return await fetchGemini(apiKey);
            if (providerName === 'openai')
                return await fetchOpenAI(apiKey);
        }
        catch (err) {
            return [
                `(live fetch failed: ${err instanceof Error ? err.message : String(err)} — showing static list)`,
                ...(exports.PROVIDER_MODELS[providerName] ?? []),
            ];
        }
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

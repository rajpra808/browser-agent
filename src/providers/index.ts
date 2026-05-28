import { AIProvider } from './base';
import { ProviderConfig } from '../config';
import { OllamaProvider } from './ollama';
import { ClaudeApiProvider } from './claude-api';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { ClaudeCodeProvider } from './claude-code';

// Fallback list used when no API key is available or the live fetch fails.
export const PROVIDER_MODELS: Record<string, string[]> = {
  'claude-api':  ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-opus-4-5'],
  'gemini':      ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  'openai':      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4'],
  'ollama':      [],
  'claude-code': [],
};

export const PROVIDERS = Object.keys(PROVIDER_MODELS);

export interface ListModelsOptions {
  baseUrl?: string;
  apiKey?: string;
}

async function fetchAnthropic(apiKey: string): Promise<string[]> {
  const res = await fetch('https://api.anthropic.com/v1/models?limit=200', {
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json() as { data: Array<{ id: string }> };
  return data.data.map(m => m.id);
}

async function fetchGemini(apiKey: string): Promise<string[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`);
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as { models: Array<{ name: string; supportedGenerationMethods?: string[] }> };
  return data.models
    .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''));
}

async function fetchOpenAI(apiKey: string): Promise<string[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { 'authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json() as { data: Array<{ id: string }> };
  return data.data.map(m => m.id).filter(id => /^(gpt|o\d|chatgpt)/i.test(id));
}

export async function listModels(providerName: string, opts: ListModelsOptions = {}): Promise<string[]> {
  const { baseUrl = 'http://localhost:11434', apiKey } = opts;

  if (providerName === 'ollama') {
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) throw new Error(`Ollama ${res.status}`);
      const data = await res.json() as { models: Array<{ name: string }> };
      return data.models.map(m => m.name);
    } catch {
      return ['(Ollama not running — start with: ollama serve)'];
    }
  }
  if (providerName === 'claude-code') {
    return ['(uses the default model configured in your claude CLI)'];
  }

  if (apiKey) {
    try {
      if (providerName === 'claude-api') return await fetchAnthropic(apiKey);
      if (providerName === 'gemini')     return await fetchGemini(apiKey);
      if (providerName === 'openai')     return await fetchOpenAI(apiKey);
    } catch (err) {
      return [
        `(live fetch failed: ${err instanceof Error ? err.message : String(err)} — showing static list)`,
        ...(PROVIDER_MODELS[providerName] ?? []),
      ];
    }
  }
  return PROVIDER_MODELS[providerName] ?? [];
}

export function createProvider(name: string, config: ProviderConfig): AIProvider {
  switch (name) {
    case 'ollama':      return new OllamaProvider(config);
    case 'claude-api':  return new ClaudeApiProvider(config);
    case 'gemini':      return new GeminiProvider(config);
    case 'openai':      return new OpenAIProvider(config);
    case 'claude-code': return new ClaudeCodeProvider(config);
    default:
      throw new Error(`Unknown provider: "${name}". Valid: ${PROVIDERS.join(', ')}`);
  }
}

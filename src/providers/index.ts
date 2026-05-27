import { AIProvider } from './base';
import { ProviderConfig } from '../config';
import { OllamaProvider } from './ollama';
import { ClaudeApiProvider } from './claude-api';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { ClaudeCodeProvider } from './claude-code';

export const PROVIDER_MODELS: Record<string, string[]> = {
  'claude-api':  ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-opus-4-5'],
  'gemini':      ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  'openai':      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4'],
  'ollama':      [],  // dynamic — fetched from local API
  'claude-code': [],  // uses claude CLI default
};

export const PROVIDERS = Object.keys(PROVIDER_MODELS);

export async function listModels(providerName: string, baseUrl = 'http://localhost:11434'): Promise<string[]> {
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

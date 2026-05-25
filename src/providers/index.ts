import { AIProvider } from './base';
import { ProviderConfig } from '../config';
import { OllamaProvider } from './ollama';
import { ClaudeApiProvider } from './claude-api';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { ClaudeCodeProvider } from './claude-code';

export function createProvider(name: string, config: ProviderConfig): AIProvider {
  switch (name) {
    case 'ollama':       return new OllamaProvider(config);
    case 'claude-api':   return new ClaudeApiProvider(config);
    case 'gemini':       return new GeminiProvider(config);
    case 'openai':       return new OpenAIProvider(config);
    case 'claude-code':  return new ClaudeCodeProvider(config);
    default:
      throw new Error(`Unknown provider: "${name}". Valid: ollama, claude-api, gemini, openai, claude-code`);
  }
}

import { AIProvider } from './base';
import { ProviderConfig } from '../config';

function requireOptional(pkg: string, provider: string): unknown {
  try {
    return require(pkg);
  } catch {
    throw new Error(
      `Provider "${provider}" requires "${pkg}" which is not installed.\n` +
      `Run: npm install ${pkg}`
    );
  }
}

export function createProvider(name: string, config: ProviderConfig): AIProvider {
  switch (name) {
    case 'ollama': {
      const { OllamaProvider } = require('./ollama');
      return new OllamaProvider(config);
    }
    case 'claude-api': {
      requireOptional('@anthropic-ai/sdk', 'claude-api');
      const { ClaudeApiProvider } = require('./claude-api');
      return new ClaudeApiProvider(config);
    }
    case 'gemini': {
      requireOptional('@google/genai', 'gemini');
      const { GeminiProvider } = require('./gemini');
      return new GeminiProvider(config);
    }
    case 'openai': {
      requireOptional('openai', 'openai');
      const { OpenAIProvider } = require('./openai');
      return new OpenAIProvider(config);
    }
    case 'claude-code': {
      const { ClaudeCodeProvider } = require('./claude-code');
      return new ClaudeCodeProvider(config);
    }
    default:
      throw new Error(`Unknown provider: "${name}". Valid: ollama, claude-api, gemini, openai, claude-code`);
  }
}

import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const GLOBAL_BASE = path.join(os.homedir(), '.browser-agent');

export interface ProviderConfig {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface Config {
  provider: string;
  providers: Record<string, ProviderConfig>;
  browser: {
    headless: boolean;
    sessionDir: string;
    defaultAccount: string;
    viewport: { width: number; height: number };
  };
  agent: {
    maxSteps: number;
    stepDelayMs: number;
  };
  logging: {
    dir: string;
  };
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function parseProviders(raw: unknown): Record<string, ProviderConfig> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, ProviderConfig> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const p = v as Record<string, unknown>;
      out[k] = {
        ...(typeof p['model'] === 'string' ? { model: p['model'] } : {}),
        ...(typeof p['apiKey'] === 'string' ? { apiKey: p['apiKey'] } : {}),
        ...(typeof p['baseUrl'] === 'string' ? { baseUrl: p['baseUrl'] } : {}),
      };
    }
  }
  return out;
}

function parseConfig(raw: Record<string, unknown>): Config {
  const browser = (raw['browser'] ?? {}) as Record<string, unknown>;
  const viewport = (browser['viewport'] ?? {}) as Record<string, unknown>;
  const agent = (raw['agent'] ?? {}) as Record<string, unknown>;
  const logging = (raw['logging'] ?? {}) as Record<string, unknown>;

  return {
    provider: str(raw['provider'], 'claude-api'),
    providers: parseProviders(raw['providers']),
    browser: {
      headless: bool(browser['headless'], false),
      sessionDir: str(browser['sessionDir'], path.join(GLOBAL_BASE, 'sessions')),
      defaultAccount: str(browser['defaultAccount'], 'default'),
      viewport: {
        width: num(viewport['width'], 1280),
        height: num(viewport['height'], 800),
      },
    },
    agent: {
      maxSteps: num(agent['maxSteps'], 30),
      stepDelayMs: num(agent['stepDelayMs'], 500),
    },
    logging: {
      dir: str(logging['dir'], path.join(GLOBAL_BASE, 'logs')),
    },
  };
}

function resolveEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (_, key: string) => process.env[key] ?? '');
  }
  if (Array.isArray(obj)) return obj.map(resolveEnvVars);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, resolveEnvVars(v)])
    );
  }
  return obj;
}

function loadConfigFile(): Record<string, unknown> {
  const candidates = [
    path.join(process.cwd(), 'browser-agent.config.json'),
    path.join(process.env.HOME ?? '', '.browser-agent', 'config.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, unknown>;
    }
  }
  return {};
}

let cached: Config | null = null;

export function _resolveEnvVars(obj: unknown): unknown {
  return resolveEnvVars(obj);
}

export function _resetConfigCache(): void {
  cached = null;
}

export function getConfig(): Config {
  if (cached) return cached;

  const raw = resolveEnvVars(loadConfigFile()) as Record<string, unknown>;
  const config = parseConfig(raw);

  if (process.env.BROWSER_AGENT_PROVIDER) {
    config.provider = process.env.BROWSER_AGENT_PROVIDER;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    config.providers['claude-api'] = { ...(config.providers['claude-api'] ?? {}), apiKey: process.env.ANTHROPIC_API_KEY };
  }
  if (process.env.GEMINI_API_KEY) {
    config.providers['gemini'] = { ...(config.providers['gemini'] ?? {}), apiKey: process.env.GEMINI_API_KEY };
  }
  if (process.env.OPENAI_API_KEY) {
    config.providers['openai'] = { ...(config.providers['openai'] ?? {}), apiKey: process.env.OPENAI_API_KEY };
  }

  cached = config;
  return cached;
}

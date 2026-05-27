import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const GLOBAL_BASE = path.join(os.homedir(), '.browser-agent');

const ProviderConfigSchema = z.object({
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

const ViewportSchema = z.object({
  width: z.number(),
  height: z.number(),
}).default({ width: 1280, height: 800 });

const BrowserSchema = z.object({
  headless: z.boolean().default(false),
  sessionDir: z.string().default('./sessions'),
  defaultAccount: z.string().default('default'),
  viewport: ViewportSchema,
}).default(() => ({
  headless: false,
  sessionDir: path.join(GLOBAL_BASE, 'sessions'),
  defaultAccount: 'default',
  viewport: { width: 1280, height: 800 },
}));

const AgentSchema = z.object({
  maxSteps: z.number().default(30),
  stepDelayMs: z.number().default(500),
}).default({ maxSteps: 30, stepDelayMs: 500 });

const LoggingSchema = z.object({
  dir: z.string().default('./logs'),
}).default(() => ({ dir: path.join(GLOBAL_BASE, 'logs') }));

const ConfigSchema = z.object({
  provider: z.string().default('claude-api'),
  providers: z.record(ProviderConfigSchema).default({}),
  browser: BrowserSchema,
  agent: AgentSchema,
  logging: LoggingSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

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

  const raw = resolveEnvVars(loadConfigFile());
  const parsed = ConfigSchema.parse(raw);

  if (process.env.BROWSER_AGENT_PROVIDER) {
    parsed.provider = process.env.BROWSER_AGENT_PROVIDER;
  }

  // Inject env-sourced API keys, preserving any config-file values
  const providers = parsed.providers as Record<string, ProviderConfig>;

  if (process.env.ANTHROPIC_API_KEY) {
    providers['claude-api'] = { ...(providers['claude-api'] ?? {}), apiKey: process.env.ANTHROPIC_API_KEY };
  }
  if (process.env.GEMINI_API_KEY) {
    providers['gemini'] = { ...(providers['gemini'] ?? {}), apiKey: process.env.GEMINI_API_KEY };
  }
  if (process.env.OPENAI_API_KEY) {
    providers['openai'] = { ...(providers['openai'] ?? {}), apiKey: process.env.OPENAI_API_KEY };
  }

  cached = parsed;
  return cached;
}

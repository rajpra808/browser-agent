import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { _resolveEnvVars, _resetConfigCache, getConfig } from './config';

describe('_resolveEnvVars', () => {
  it('replaces ${VAR} with env value', () => {
    process.env.TEST_RESOLVE_VAR = 'my-key';
    expect(_resolveEnvVars('${TEST_RESOLVE_VAR}')).toBe('my-key');
    delete process.env.TEST_RESOLVE_VAR;
  });

  it('replaces multiple vars in a string', () => {
    process.env.A_VAR = 'hello';
    process.env.B_VAR = 'world';
    expect(_resolveEnvVars('${A_VAR} ${B_VAR}')).toBe('hello world');
    delete process.env.A_VAR;
    delete process.env.B_VAR;
  });

  it('returns empty string for missing env var', () => {
    delete process.env.MISSING_VAR_XYZ;
    expect(_resolveEnvVars('${MISSING_VAR_XYZ}')).toBe('');
  });

  it('resolves nested object values', () => {
    process.env.NESTED_KEY = 'secret';
    const result = _resolveEnvVars({ a: '${NESTED_KEY}', b: { c: '${NESTED_KEY}' } }) as Record<string, unknown>;
    expect(result['a']).toBe('secret');
    expect((result['b'] as Record<string, unknown>)['c']).toBe('secret');
    delete process.env.NESTED_KEY;
  });

  it('resolves values inside arrays', () => {
    process.env.ARR_VAR = 'val';
    const result = _resolveEnvVars(['${ARR_VAR}', 'plain']) as string[];
    expect(result[0]).toBe('val');
    expect(result[1]).toBe('plain');
    delete process.env.ARR_VAR;
  });

  it('passes through non-string primitives unchanged', () => {
    expect(_resolveEnvVars(42)).toBe(42);
    expect(_resolveEnvVars(true)).toBe(true);
    expect(_resolveEnvVars(null)).toBe(null);
  });

  it('does not alter string without ${} patterns', () => {
    expect(_resolveEnvVars('plain string')).toBe('plain string');
  });
});

describe('getConfig', () => {
  let tmpDir: string;
  const origCwd = process.cwd();

  beforeEach(() => {
    _resetConfigCache();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    _resetConfigCache();
    // Clean env vars set in tests
    delete process.env.BROWSER_AGENT_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('returns defaults when no config file present', () => {
    const config = getConfig();
    expect(config.provider).toBe('claude-api');
    expect(config.browser.headless).toBe(false);
    expect(config.browser.viewport).toEqual({ width: 1280, height: 800 });
    expect(config.agent.maxSteps).toBe(30);
    expect(config.agent.stepDelayMs).toBe(500);
    expect(config.logging.dir).toBe('./logs');
  });

  it('loads config file and overrides defaults', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'browser-agent.config.json'),
      JSON.stringify({ provider: 'gemini', agent: { maxSteps: 10, stepDelayMs: 200 } })
    );
    const config = getConfig();
    expect(config.provider).toBe('gemini');
    expect(config.agent.maxSteps).toBe(10);
    expect(config.agent.stepDelayMs).toBe(200);
  });

  it('BROWSER_AGENT_PROVIDER env overrides config file provider', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'browser-agent.config.json'),
      JSON.stringify({ provider: 'gemini' })
    );
    process.env.BROWSER_AGENT_PROVIDER = 'ollama';
    const config = getConfig();
    expect(config.provider).toBe('ollama');
  });

  it('injects ANTHROPIC_API_KEY into claude-api provider', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-123';
    const config = getConfig();
    const providers = config.providers as Record<string, { apiKey?: string }>;
    expect(providers['claude-api']?.apiKey).toBe('sk-test-123');
  });

  it('injects GEMINI_API_KEY into gemini provider', () => {
    process.env.GEMINI_API_KEY = 'gemini-key-456';
    const config = getConfig();
    const providers = config.providers as Record<string, { apiKey?: string }>;
    expect(providers['gemini']?.apiKey).toBe('gemini-key-456');
  });

  it('injects OPENAI_API_KEY into openai provider', () => {
    process.env.OPENAI_API_KEY = 'openai-key-789';
    const config = getConfig();
    const providers = config.providers as Record<string, { apiKey?: string }>;
    expect(providers['openai']?.apiKey).toBe('openai-key-789');
  });

  it('caches result across calls', () => {
    const c1 = getConfig();
    const c2 = getConfig();
    expect(c1).toBe(c2);
  });

  it('resolves ${VAR} syntax in config file values', () => {
    process.env.MY_PROVIDER_KEY = 'resolved-key';
    fs.writeFileSync(
      path.join(tmpDir, 'browser-agent.config.json'),
      JSON.stringify({ providers: { 'claude-api': { apiKey: '${MY_PROVIDER_KEY}' } } })
    );
    const config = getConfig();
    const providers = config.providers as Record<string, { apiKey?: string }>;
    expect(providers['claude-api']?.apiKey).toBe('resolved-key');
    delete process.env.MY_PROVIDER_KEY;
  });
});

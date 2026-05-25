import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Must reset config cache + mock before importing logger
vi.mock('../config', () => ({
  getConfig: vi.fn(),
}));

import { getConfig } from '../config';
import { logStep, StepLogEntry } from './logger';

function makeTmpLogDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ba-logger-'));
}

function setupConfig(logDir: string) {
  (getConfig as ReturnType<typeof vi.fn>).mockReturnValue({
    logging: { dir: logDir },
  });
}

describe('logStep', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpLogDir();
    setupConfig(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('creates logger.csv with header on first call', () => {
    const entry: StepLogEntry = {
      taskId: 'task1',
      step: 1,
      provider: 'claude-api',
      action: { action: 'click', x: 100, y: 200, reason: 'test' },
      outcome: 'success',
      durationMs: 500,
    };
    logStep(entry);
    const csvPath = path.join(tmpDir, 'logger.csv');
    expect(fs.existsSync(csvPath)).toBe(true);
    const content = fs.readFileSync(csvPath, 'utf8');
    expect(content.startsWith('timestamp,task_id,step,provider,action,')).toBe(true);
  });

  it('appends a row for click action with x/y', () => {
    const entry: StepLogEntry = {
      taskId: 'abc',
      step: 2,
      provider: 'gemini',
      action: { action: 'click', x: 300, y: 450, reason: 'click button' },
      outcome: 'success',
      durationMs: 123,
    };
    logStep(entry);
    const content = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8');
    expect(content).toContain('click');
    expect(content).toContain('300');
    expect(content).toContain('450');
    expect(content).toContain('click button');
    expect(content).toContain('gemini');
  });

  it('appends a row for type action with text', () => {
    const entry: StepLogEntry = {
      taskId: 'abc',
      step: 1,
      provider: 'openai',
      action: { action: 'type', text: 'hello world', reason: 'fill input' },
      outcome: 'success',
      durationMs: 50,
    };
    logStep(entry);
    const content = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8');
    expect(content).toContain('type');
    expect(content).toContain('hello world');
  });

  it('includes error info in outcome column', () => {
    const entry: StepLogEntry = {
      taskId: 'err1',
      step: 1,
      provider: 'ollama',
      action: { action: 'click', x: 0, y: 0, reason: 'test' },
      outcome: 'error',
      error: 'element stale',
      durationMs: 10,
    };
    logStep(entry);
    const content = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8');
    expect(content).toContain('error');
    expect(content).toContain('element stale');
  });

  it('escapes commas in text field with quotes', () => {
    const entry: StepLogEntry = {
      taskId: 'q1',
      step: 1,
      provider: 'claude-api',
      action: { action: 'type', text: 'hello, world', reason: 'comma test' },
      outcome: 'success',
      durationMs: 10,
    };
    logStep(entry);
    const content = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8');
    expect(content).toContain('"hello, world"');
  });

  it('appends multiple rows without overwriting', () => {
    const base: StepLogEntry = {
      taskId: 'multi',
      step: 1,
      provider: 'claude-api',
      action: { action: 'wait', ms: 100, reason: 'wait' },
      outcome: 'success',
      durationMs: 100,
    };
    logStep(base);
    logStep({ ...base, step: 2 });
    logStep({ ...base, step: 3 });
    const lines = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8').trim().split('\n');
    expect(lines.length).toBe(4); // header + 3 rows
  });

  it('logs scroll action with direction and pixels', () => {
    const entry: StepLogEntry = {
      taskId: 's1',
      step: 1,
      provider: 'claude-api',
      action: { action: 'scroll', direction: 'up', pixels: 500, reason: 'scroll up' },
      outcome: 'success',
      durationMs: 20,
    };
    logStep(entry);
    const content = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8');
    expect(content).toContain('scroll');
    expect(content).toContain('up');
    expect(content).toContain('500');
  });

  it('logs done action with summary as reason', () => {
    const entry: StepLogEntry = {
      taskId: 'd1',
      step: 5,
      provider: 'claude-api',
      action: { action: 'done', summary: 'task finished' },
      outcome: 'success',
      durationMs: 1000,
    };
    logStep(entry);
    const content = fs.readFileSync(path.join(tmpDir, 'logger.csv'), 'utf8');
    expect(content).toContain('done');
    expect(content).toContain('task finished');
  });
});

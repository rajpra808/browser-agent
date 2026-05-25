import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

vi.mock('../config', () => ({
  getConfig: vi.fn(),
}));

import { getConfig } from '../config';
import { logStats, TaskStats } from './stats';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ba-stats-'));
}

function setupConfig(logDir: string) {
  (getConfig as ReturnType<typeof vi.fn>).mockReturnValue({
    logging: { dir: logDir },
  });
}

const base: TaskStats = {
  taskId: 'task-xyz',
  task: 'Go to google and search cats',
  account: 'default',
  provider: 'claude-api',
  stepsTotal: 5,
  outcome: 'done',
  startTime: new Date('2025-01-01T10:00:00Z'),
  endTime: new Date('2025-01-01T10:00:30Z'),
  summary: 'Searched for cats successfully',
};

describe('logStats', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    setupConfig(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('creates stats.csv with header on first call', () => {
    logStats(base);
    const csvPath = path.join(tmpDir, 'stats.csv');
    expect(fs.existsSync(csvPath)).toBe(true);
    const content = fs.readFileSync(csvPath, 'utf8');
    expect(content.startsWith('task_id,timestamp,task,account,provider,')).toBe(true);
  });

  it('writes task_id, task, account, provider in row', () => {
    logStats(base);
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain('task-xyz');
    expect(content).toContain('default');
    expect(content).toContain('claude-api');
  });

  it('writes correct duration_ms (30000 for 30s)', () => {
    logStats(base);
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain('30000');
  });

  it('writes outcome "done"', () => {
    logStats(base);
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain(',done,');
  });

  it('writes outcome "failed"', () => {
    logStats({ ...base, outcome: 'failed', summary: 'could not find element' });
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain(',failed,');
  });

  it('writes outcome "max_steps"', () => {
    logStats({ ...base, outcome: 'max_steps', summary: 'gave up after 30 steps' });
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain(',max_steps,');
  });

  it('writes steps_total count', () => {
    logStats({ ...base, stepsTotal: 7 });
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain(',7,');
  });

  it('appends multiple rows without overwriting', () => {
    logStats(base);
    logStats({ ...base, taskId: 'task-2' });
    logStats({ ...base, taskId: 'task-3' });
    const lines = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8').trim().split('\n');
    expect(lines.length).toBe(4); // header + 3 rows
  });

  it('escapes commas in task description', () => {
    logStats({ ...base, task: 'Go to google, then search cats, then scroll' });
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain('"Go to google, then search cats, then scroll"');
  });

  it('writes summary text', () => {
    logStats(base);
    const content = fs.readFileSync(path.join(tmpDir, 'stats.csv'), 'utf8');
    expect(content).toContain('Searched for cats successfully');
  });

  it('creates logs directory if it does not exist', () => {
    const nestedDir = path.join(tmpDir, 'deep', 'nested', 'logs');
    setupConfig(nestedDir);
    logStats(base);
    expect(fs.existsSync(path.join(nestedDir, 'stats.csv'))).toBe(true);
  });
});

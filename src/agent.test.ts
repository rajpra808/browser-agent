import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all external dependencies before importing agent
vi.mock('./config', () => ({
  getConfig: vi.fn(() => ({
    provider: 'mock-provider',
    providers: {},
    browser: { defaultAccount: 'default', headless: true, sessionDir: '/tmp/sessions', viewport: { width: 1280, height: 800 } },
    agent: { maxSteps: 5, stepDelayMs: 0 },
    logging: { dir: '/tmp/logs' },
  })),
}));

vi.mock('./providers/index', () => ({
  createProvider: vi.fn(),
}));

vi.mock('./browser/instance', () => ({
  getActivePage: vi.fn(),
}));

vi.mock('./browser/actions', () => ({
  screenshot: vi.fn(),
  saveScreenshot: vi.fn(),
  clickElement: vi.fn(),
  doubleClickElement: vi.fn(),
  rightClickElement: vi.fn(),
  hoverElement: vi.fn(),
  drag: vi.fn(),
  typeText: vi.fn(),
  clearField: vi.fn(),
  scroll: vi.fn(),
  pressKey: vi.fn(),
  wait: vi.fn(),
  navigate: vi.fn(),
  goBack: vi.fn(),
  goForward: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('./browser/marks', () => ({
  annotatePage: vi.fn(() => Promise.resolve([])),
  clearMarks: vi.fn(() => Promise.resolve()),
}));

vi.mock('./logging/logger', () => ({
  logStep: vi.fn(),
}));

vi.mock('./logging/stats', () => ({
  logStats: vi.fn(),
}));

import { runTask } from './agent';
import { createProvider } from './providers/index';
import { getActivePage } from './browser/instance';
import * as actions from './browser/actions';
import { logStep } from './logging/logger';
import { logStats } from './logging/stats';
import { BrowserAction } from './providers/base';

function makeProvider(responses: BrowserAction[]) {
  let i = 0;
  return {
    name: 'mock',
    decideAction: vi.fn(() => responses[Math.min(i++, responses.length - 1)]),
  };
}

function makePage() {
  return {
    url: vi.fn(() => 'https://test.com'),
    isClosed: vi.fn(() => false),
    evaluate: vi.fn(() => Promise.resolve('')),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (actions.screenshot as ReturnType<typeof vi.fn>).mockResolvedValue('base64screenshot');
  (actions.clickElement as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (actions.typeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (actions.scroll as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (actions.pressKey as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (actions.wait as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (logStep as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
  (logStats as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
});

describe('runTask', () => {
  it('returns done when provider signals done', async () => {
    const provider = makeProvider([{ action: 'done', summary: 'completed' }]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    const result = await runTask({ task: 'test task' });
    expect(result.outcome).toBe('done');
    expect(result.summary).toBe('completed');
  });

  it('returns failed when provider signals failed', async () => {
    const provider = makeProvider([{ action: 'failed', reason: 'blocked by captcha' }]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    const result = await runTask({ task: 'test task' });
    expect(result.outcome).toBe('failed');
    expect(result.summary).toBe('blocked by captcha');
  });

  it('returns max_steps when provider never finishes', async () => {
    const provider = makeProvider([{ action: 'click', id: 1, reason: 'keep clicking' }]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    const result = await runTask({ task: 'test task', maxSteps: 3 });
    expect(result.outcome).toBe('max_steps');
  });

  it('executes click action via browser', async () => {
    const provider = makeProvider([
      { action: 'click', id: 7, reason: 'click search' },
      { action: 'done', summary: 'clicked' },
    ]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task' });
    expect(actions.clickElement).toHaveBeenCalledWith(expect.anything(), 7);
  });

  it('executes type action via browser', async () => {
    const provider = makeProvider([
      { action: 'type', text: 'hello world', reason: 'type query' },
      { action: 'done', summary: 'typed' },
    ]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task' });
    expect(actions.typeText).toHaveBeenCalledWith(expect.anything(), 'hello world', undefined);
  });

  it('executes scroll action via browser', async () => {
    const provider = makeProvider([
      { action: 'scroll', direction: 'down', pixels: 300, reason: 'scroll' },
      { action: 'done', summary: 'done' },
    ]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task' });
    expect(actions.scroll).toHaveBeenCalledWith(expect.anything(), 'down', 300);
  });

  it('executes key press via browser', async () => {
    const provider = makeProvider([
      { action: 'key', key: 'Enter', reason: 'submit' },
      { action: 'done', summary: 'done' },
    ]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task' });
    expect(actions.pressKey).toHaveBeenCalledWith(expect.anything(), 'Enter');
  });

  it('logs each step to logger.csv', async () => {
    const provider = makeProvider([
      { action: 'click', id: 0, reason: 'step 1' },
      { action: 'done', summary: 'done' },
    ]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task' });
    expect(logStep).toHaveBeenCalledTimes(2);
  });

  it('logs task stats to stats.csv once', async () => {
    const provider = makeProvider([{ action: 'done', summary: 'done' }]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task' });
    expect(logStats).toHaveBeenCalledTimes(1);
  });

  it('uses specified provider name', async () => {
    const provider = makeProvider([{ action: 'done', summary: 'ok' }]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task', provider: 'gemini' });
    expect(createProvider).toHaveBeenCalledWith('gemini', expect.anything());
  });

  it('uses specified account name', async () => {
    const provider = makeProvider([{ action: 'done', summary: 'ok' }]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    await runTask({ task: 'test task', account: 'instagram_main' });
    expect(getActivePage).toHaveBeenCalledWith('instagram_main', expect.anything());
  });

  it('continues on browser execute error and marks step as error', async () => {
    (actions.clickElement as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('click failed'));
    const provider = makeProvider([
      { action: 'click', id: 0, reason: 'try click' },
      { action: 'done', summary: 'recovered' },
    ]);
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    const result = await runTask({ task: 'test task' });
    expect(result.outcome).toBe('done');
    // step that errored should be logged with 'error' outcome
    expect(logStep).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'error' }));
  });

  it('handles LLM error gracefully and stops as failed', async () => {
    const provider = {
      name: 'mock',
      decideAction: vi.fn().mockRejectedValue(new Error('API timeout')),
    };
    (createProvider as ReturnType<typeof vi.fn>).mockReturnValue(provider);
    (getActivePage as ReturnType<typeof vi.fn>).mockResolvedValue({ page: makePage() });

    const result = await runTask({ task: 'test task', maxSteps: 1 });
    expect(result.outcome).toBe('failed');
    expect(result.summary).toContain('API timeout');
  });
});

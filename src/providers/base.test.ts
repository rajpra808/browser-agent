import { describe, it, expect } from 'vitest';
import { parseAction, buildUserMessage, getActionReason, BrowserAction, ActionHistory } from './base';

describe('parseAction', () => {
  it('parses clean click JSON', () => {
    const a = parseAction('{"action":"click","x":450,"y":230,"reason":"click login"}');
    expect(a).toEqual({ action: 'click', x: 450, y: 230, reason: 'click login' });
  });

  it('parses type action', () => {
    const a = parseAction('{"action":"type","text":"hello@test.com","reason":"enter email"}');
    expect(a).toEqual({ action: 'type', text: 'hello@test.com', reason: 'enter email' });
  });

  it('parses scroll action', () => {
    const a = parseAction('{"action":"scroll","direction":"down","pixels":300,"reason":"see more"}');
    expect(a).toEqual({ action: 'scroll', direction: 'down', pixels: 300, reason: 'see more' });
  });

  it('parses key action', () => {
    const a = parseAction('{"action":"key","key":"Enter","reason":"submit form"}');
    expect(a).toEqual({ action: 'key', key: 'Enter', reason: 'submit form' });
  });

  it('parses wait action', () => {
    const a = parseAction('{"action":"wait","ms":2000,"reason":"page loading"}');
    expect(a).toEqual({ action: 'wait', ms: 2000, reason: 'page loading' });
  });

  it('parses done action', () => {
    const a = parseAction('{"action":"done","summary":"task completed"}');
    expect(a).toEqual({ action: 'done', summary: 'task completed' });
  });

  it('parses failed action', () => {
    const a = parseAction('{"action":"failed","reason":"element not found"}');
    expect(a).toEqual({ action: 'failed', reason: 'element not found' });
  });

  it('strips ```json markdown fences', () => {
    const a = parseAction('```json\n{"action":"click","x":100,"y":200,"reason":"test"}\n```');
    expect(a).toEqual({ action: 'click', x: 100, y: 200, reason: 'test' });
  });

  it('strips plain ``` markdown fences', () => {
    const a = parseAction('```\n{"action":"done","summary":"ok"}\n```');
    expect(a).toEqual({ action: 'done', summary: 'ok' });
  });

  it('extracts JSON embedded in surrounding text', () => {
    const a = parseAction('I will click the login button: {"action":"click","x":300,"y":150,"reason":"login btn"}');
    expect(a.action).toBe('click');
  });

  it('throws when input is not JSON', () => {
    expect(() => parseAction('I cannot determine the next action')).toThrow();
  });

  it('throws when action field is missing', () => {
    expect(() => parseAction('{"x":100,"y":200,"reason":"test"}')).toThrow();
  });
});

describe('buildUserMessage', () => {
  it('includes task in output', () => {
    const msg = buildUserMessage('search cats', []);
    expect(msg).toContain('TASK: search cats');
  });

  it('includes current URL when provided', () => {
    const msg = buildUserMessage('search', [], 'https://google.com');
    expect(msg).toContain('Current URL: https://google.com');
  });

  it('shows "No actions taken yet" for empty history', () => {
    const msg = buildUserMessage('task', []);
    expect(msg).toContain('No actions taken yet.');
  });

  it('formats click history entry', () => {
    const history: ActionHistory[] = [{
      step: 1,
      action: { action: 'click', x: 100, y: 200, reason: 'clicked btn' },
      outcome: 'success',
    }];
    const msg = buildUserMessage('task', history);
    expect(msg).toContain('1.');
    expect(msg).toContain('click(100,200)');
    expect(msg).toContain('clicked btn');
  });

  it('formats type history entry', () => {
    const history: ActionHistory[] = [{
      step: 1,
      action: { action: 'type', text: 'hello', reason: 'enter text' },
      outcome: 'success',
    }];
    const msg = buildUserMessage('task', history);
    expect(msg).toContain('type("hello")');
  });

  it('appends error info on failed history entry', () => {
    const history: ActionHistory[] = [{
      step: 1,
      action: { action: 'click', x: 0, y: 0, reason: 'test' },
      outcome: 'error',
      error: 'element not found',
    }];
    const msg = buildUserMessage('task', history);
    expect(msg).toContain('[ERROR: element not found]');
  });

  it('formats multiple history entries in order', () => {
    const history: ActionHistory[] = [
      { step: 1, action: { action: 'click', x: 10, y: 20, reason: 'a' }, outcome: 'success' },
      { step: 2, action: { action: 'type', text: 'hello', reason: 'b' }, outcome: 'success' },
    ];
    const msg = buildUserMessage('task', history);
    const idx1 = msg.indexOf('1.');
    const idx2 = msg.indexOf('2.');
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx2).toBeGreaterThan(idx1);
  });

  it('omits URL line when pageUrl not provided', () => {
    const msg = buildUserMessage('task', []);
    expect(msg).not.toContain('Current URL:');
  });
});

describe('getActionReason', () => {
  it('returns reason for click', () => {
    const a: BrowserAction = { action: 'click', x: 0, y: 0, reason: 'click reason' };
    expect(getActionReason(a)).toBe('click reason');
  });

  it('returns reason for type', () => {
    const a: BrowserAction = { action: 'type', text: 'hi', reason: 'type reason' };
    expect(getActionReason(a)).toBe('type reason');
  });

  it('returns reason for scroll', () => {
    const a: BrowserAction = { action: 'scroll', direction: 'up', pixels: 100, reason: 'scroll up' };
    expect(getActionReason(a)).toBe('scroll up');
  });

  it('returns reason for key', () => {
    const a: BrowserAction = { action: 'key', key: 'Tab', reason: 'next field' };
    expect(getActionReason(a)).toBe('next field');
  });

  it('returns reason for wait', () => {
    const a: BrowserAction = { action: 'wait', ms: 500, reason: 'loading' };
    expect(getActionReason(a)).toBe('loading');
  });

  it('returns summary for done', () => {
    const a: BrowserAction = { action: 'done', summary: 'all done' };
    expect(getActionReason(a)).toBe('all done');
  });

  it('returns reason for failed', () => {
    const a: BrowserAction = { action: 'failed', reason: 'stuck' };
    expect(getActionReason(a)).toBe('stuck');
  });
});

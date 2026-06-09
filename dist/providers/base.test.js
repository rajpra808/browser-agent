"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const base_1 = require("./base");
(0, vitest_1.describe)('parseAction', () => {
    (0, vitest_1.it)('parses clean click JSON', () => {
        const a = (0, base_1.parseAction)('{"action":"click","id":5,"reason":"click login"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'click', id: 5, reason: 'click login' });
    });
    (0, vitest_1.it)('parses type action', () => {
        const a = (0, base_1.parseAction)('{"action":"type","text":"hello@test.com","reason":"enter email"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'type', text: 'hello@test.com', reason: 'enter email' });
    });
    (0, vitest_1.it)('parses scroll action', () => {
        const a = (0, base_1.parseAction)('{"action":"scroll","direction":"down","pixels":300,"reason":"see more"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'scroll', direction: 'down', pixels: 300, reason: 'see more' });
    });
    (0, vitest_1.it)('parses key action', () => {
        const a = (0, base_1.parseAction)('{"action":"key","key":"Enter","reason":"submit form"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'key', key: 'Enter', reason: 'submit form' });
    });
    (0, vitest_1.it)('parses wait action', () => {
        const a = (0, base_1.parseAction)('{"action":"wait","ms":2000,"reason":"page loading"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'wait', ms: 2000, reason: 'page loading' });
    });
    (0, vitest_1.it)('parses done action', () => {
        const a = (0, base_1.parseAction)('{"action":"done","summary":"task completed"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'done', summary: 'task completed' });
    });
    (0, vitest_1.it)('parses failed action', () => {
        const a = (0, base_1.parseAction)('{"action":"failed","reason":"element not found"}');
        (0, vitest_1.expect)(a).toEqual({ action: 'failed', reason: 'element not found' });
    });
    (0, vitest_1.it)('strips ```json markdown fences', () => {
        const a = (0, base_1.parseAction)('```json\n{"action":"click","id":3,"reason":"test"}\n```');
        (0, vitest_1.expect)(a).toEqual({ action: 'click', id: 3, reason: 'test' });
    });
    (0, vitest_1.it)('strips plain ``` markdown fences', () => {
        const a = (0, base_1.parseAction)('```\n{"action":"done","summary":"ok"}\n```');
        (0, vitest_1.expect)(a).toEqual({ action: 'done', summary: 'ok' });
    });
    (0, vitest_1.it)('extracts JSON embedded in surrounding text', () => {
        const a = (0, base_1.parseAction)('I will click the login button: {"action":"click","id":7,"reason":"login btn"}');
        (0, vitest_1.expect)(a.action).toBe('click');
    });
    (0, vitest_1.it)('throws when input is not JSON', () => {
        (0, vitest_1.expect)(() => (0, base_1.parseAction)('I cannot determine the next action')).toThrow();
    });
    (0, vitest_1.it)('throws when action field is missing', () => {
        (0, vitest_1.expect)(() => (0, base_1.parseAction)('{"id":4,"reason":"test"}')).toThrow();
    });
});
(0, vitest_1.describe)('buildUserMessage', () => {
    (0, vitest_1.it)('includes task in output', () => {
        const msg = (0, base_1.buildUserMessage)('search cats', [], undefined, []);
        (0, vitest_1.expect)(msg).toContain('TASK: search cats');
    });
    (0, vitest_1.it)('includes current URL when provided', () => {
        const msg = (0, base_1.buildUserMessage)('search', [], 'https://google.com', []);
        (0, vitest_1.expect)(msg).toContain('Current URL: https://google.com');
    });
    (0, vitest_1.it)('shows "No actions taken yet" for empty history', () => {
        const msg = (0, base_1.buildUserMessage)('task', [], undefined, []);
        (0, vitest_1.expect)(msg).toContain('No actions taken yet.');
    });
    (0, vitest_1.it)('renders the element list by id', () => {
        const msg = (0, base_1.buildUserMessage)('task', [], undefined, [
            { id: 5, tag: 'input', role: 'searchbox', name: 'Search' },
        ]);
        (0, vitest_1.expect)(msg).toContain('[5] input');
        (0, vitest_1.expect)(msg).toContain('"Search"');
    });
    (0, vitest_1.it)('formats click history entry', () => {
        const history = [{
                step: 1,
                action: { action: 'click', id: 5, reason: 'clicked btn' },
                outcome: 'success',
            }];
        const msg = (0, base_1.buildUserMessage)('task', history, undefined, []);
        (0, vitest_1.expect)(msg).toContain('1.');
        (0, vitest_1.expect)(msg).toContain('click(#5)');
        (0, vitest_1.expect)(msg).toContain('clicked btn');
    });
    (0, vitest_1.it)('formats type history entry', () => {
        const history = [{
                step: 1,
                action: { action: 'type', text: 'hello', reason: 'enter text' },
                outcome: 'success',
            }];
        const msg = (0, base_1.buildUserMessage)('task', history, undefined, []);
        (0, vitest_1.expect)(msg).toContain('type("hello")');
    });
    (0, vitest_1.it)('appends feedback on history entry', () => {
        const history = [{
                step: 1,
                action: { action: 'click', id: 2, reason: 'test' },
                outcome: 'success',
                feedback: 'focused: input[Search]',
            }];
        const msg = (0, base_1.buildUserMessage)('task', history, undefined, []);
        (0, vitest_1.expect)(msg).toContain('focused: input[Search]');
    });
    (0, vitest_1.it)('appends error info on failed history entry', () => {
        const history = [{
                step: 1,
                action: { action: 'click', id: 0, reason: 'test' },
                outcome: 'error',
                error: 'element not found',
            }];
        const msg = (0, base_1.buildUserMessage)('task', history, undefined, []);
        (0, vitest_1.expect)(msg).toContain('[ERROR: element not found]');
    });
    (0, vitest_1.it)('formats multiple history entries in order', () => {
        const history = [
            { step: 1, action: { action: 'click', id: 1, reason: 'a' }, outcome: 'success' },
            { step: 2, action: { action: 'type', text: 'hello', reason: 'b' }, outcome: 'success' },
        ];
        const msg = (0, base_1.buildUserMessage)('task', history, undefined, []);
        const idx1 = msg.indexOf('1.');
        const idx2 = msg.indexOf('2.');
        (0, vitest_1.expect)(idx1).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(idx2).toBeGreaterThan(idx1);
    });
    (0, vitest_1.it)('omits URL line when pageUrl not provided', () => {
        const msg = (0, base_1.buildUserMessage)('task', [], undefined, []);
        (0, vitest_1.expect)(msg).not.toContain('Current URL:');
    });
});
(0, vitest_1.describe)('getActionReason', () => {
    (0, vitest_1.it)('returns reason for click', () => {
        const a = { action: 'click', id: 0, reason: 'click reason' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('click reason');
    });
    (0, vitest_1.it)('returns reason for type', () => {
        const a = { action: 'type', text: 'hi', reason: 'type reason' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('type reason');
    });
    (0, vitest_1.it)('returns reason for scroll', () => {
        const a = { action: 'scroll', direction: 'up', pixels: 100, reason: 'scroll up' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('scroll up');
    });
    (0, vitest_1.it)('returns reason for key', () => {
        const a = { action: 'key', key: 'Tab', reason: 'next field' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('next field');
    });
    (0, vitest_1.it)('returns reason for wait', () => {
        const a = { action: 'wait', ms: 500, reason: 'loading' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('loading');
    });
    (0, vitest_1.it)('returns summary for done', () => {
        const a = { action: 'done', summary: 'all done' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('all done');
    });
    (0, vitest_1.it)('returns reason for failed', () => {
        const a = { action: 'failed', reason: 'stuck' };
        (0, vitest_1.expect)((0, base_1.getActionReason)(a)).toBe('stuck');
    });
});

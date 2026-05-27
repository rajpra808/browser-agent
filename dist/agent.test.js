"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock all external dependencies before importing agent
vitest_1.vi.mock('./config', () => ({
    getConfig: vitest_1.vi.fn(() => ({
        provider: 'mock-provider',
        providers: {},
        browser: { defaultAccount: 'default', headless: true, sessionDir: '/tmp/sessions', viewport: { width: 1280, height: 800 } },
        agent: { maxSteps: 5, stepDelayMs: 0 },
        logging: { dir: '/tmp/logs' },
    })),
}));
vitest_1.vi.mock('./providers/index', () => ({
    createProvider: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./browser/instance', () => ({
    getActivePage: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./browser/actions', () => ({
    screenshot: vitest_1.vi.fn(),
    click: vitest_1.vi.fn(),
    typeText: vitest_1.vi.fn(),
    scroll: vitest_1.vi.fn(),
    pressKey: vitest_1.vi.fn(),
    wait: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./logging/logger', () => ({
    logStep: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('./logging/stats', () => ({
    logStats: vitest_1.vi.fn(),
}));
const agent_1 = require("./agent");
const index_1 = require("./providers/index");
const instance_1 = require("./browser/instance");
const actions = __importStar(require("./browser/actions"));
const logger_1 = require("./logging/logger");
const stats_1 = require("./logging/stats");
function makeProvider(responses) {
    let i = 0;
    return {
        name: 'mock',
        decideAction: vitest_1.vi.fn(() => responses[Math.min(i++, responses.length - 1)]),
    };
}
function makePage() {
    return { url: vitest_1.vi.fn(() => 'https://test.com'), isClosed: vitest_1.vi.fn(() => false) };
}
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    actions.screenshot.mockResolvedValue('base64screenshot');
    actions.click.mockResolvedValue(undefined);
    actions.typeText.mockResolvedValue(undefined);
    actions.scroll.mockResolvedValue(undefined);
    actions.pressKey.mockResolvedValue(undefined);
    actions.wait.mockResolvedValue(undefined);
    logger_1.logStep.mockReturnValue(undefined);
    stats_1.logStats.mockReturnValue(undefined);
});
(0, vitest_1.describe)('runTask', () => {
    (0, vitest_1.it)('returns done when provider signals done', async () => {
        const provider = makeProvider([{ action: 'done', summary: 'completed' }]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        const result = await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(result.outcome).toBe('done');
        (0, vitest_1.expect)(result.summary).toBe('completed');
    });
    (0, vitest_1.it)('returns failed when provider signals failed', async () => {
        const provider = makeProvider([{ action: 'failed', reason: 'blocked by captcha' }]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        const result = await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(result.outcome).toBe('failed');
        (0, vitest_1.expect)(result.summary).toBe('blocked by captcha');
    });
    (0, vitest_1.it)('returns max_steps when provider never finishes', async () => {
        const provider = makeProvider([{ action: 'click', x: 100, y: 200, reason: 'keep clicking' }]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        const result = await (0, agent_1.runTask)({ task: 'test task', maxSteps: 3 });
        (0, vitest_1.expect)(result.outcome).toBe('max_steps');
    });
    (0, vitest_1.it)('executes click action via browser', async () => {
        const provider = makeProvider([
            { action: 'click', x: 300, y: 400, reason: 'click search' },
            { action: 'done', summary: 'clicked' },
        ]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(actions.click).toHaveBeenCalledWith(vitest_1.expect.anything(), 300, 400);
    });
    (0, vitest_1.it)('executes type action via browser', async () => {
        const provider = makeProvider([
            { action: 'type', text: 'hello world', reason: 'type query' },
            { action: 'done', summary: 'typed' },
        ]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(actions.typeText).toHaveBeenCalledWith(vitest_1.expect.anything(), 'hello world');
    });
    (0, vitest_1.it)('executes scroll action via browser', async () => {
        const provider = makeProvider([
            { action: 'scroll', direction: 'down', pixels: 300, reason: 'scroll' },
            { action: 'done', summary: 'done' },
        ]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(actions.scroll).toHaveBeenCalledWith(vitest_1.expect.anything(), 'down', 300);
    });
    (0, vitest_1.it)('executes key press via browser', async () => {
        const provider = makeProvider([
            { action: 'key', key: 'Enter', reason: 'submit' },
            { action: 'done', summary: 'done' },
        ]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(actions.pressKey).toHaveBeenCalledWith(vitest_1.expect.anything(), 'Enter');
    });
    (0, vitest_1.it)('logs each step to logger.csv', async () => {
        const provider = makeProvider([
            { action: 'click', x: 0, y: 0, reason: 'step 1' },
            { action: 'done', summary: 'done' },
        ]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(logger_1.logStep).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('logs task stats to stats.csv once', async () => {
        const provider = makeProvider([{ action: 'done', summary: 'done' }]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(stats_1.logStats).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('uses specified provider name', async () => {
        const provider = makeProvider([{ action: 'done', summary: 'ok' }]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task', provider: 'gemini' });
        (0, vitest_1.expect)(index_1.createProvider).toHaveBeenCalledWith('gemini', vitest_1.expect.anything());
    });
    (0, vitest_1.it)('uses specified account name', async () => {
        const provider = makeProvider([{ action: 'done', summary: 'ok' }]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        await (0, agent_1.runTask)({ task: 'test task', account: 'instagram_main' });
        (0, vitest_1.expect)(instance_1.getActivePage).toHaveBeenCalledWith('instagram_main');
    });
    (0, vitest_1.it)('continues on browser execute error and marks step as error', async () => {
        actions.click.mockRejectedValueOnce(new Error('click failed'));
        const provider = makeProvider([
            { action: 'click', x: 0, y: 0, reason: 'try click' },
            { action: 'done', summary: 'recovered' },
        ]);
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        const result = await (0, agent_1.runTask)({ task: 'test task' });
        (0, vitest_1.expect)(result.outcome).toBe('done');
        // step that errored should be logged with 'error' outcome
        (0, vitest_1.expect)(logger_1.logStep).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ outcome: 'error' }));
    });
    (0, vitest_1.it)('handles LLM error gracefully and stops as failed', async () => {
        const provider = {
            name: 'mock',
            decideAction: vitest_1.vi.fn().mockRejectedValue(new Error('API timeout')),
        };
        index_1.createProvider.mockReturnValue(provider);
        instance_1.getActivePage.mockResolvedValue({ page: makePage() });
        const result = await (0, agent_1.runTask)({ task: 'test task', maxSteps: 1 });
        (0, vitest_1.expect)(result.outcome).toBe('failed');
        (0, vitest_1.expect)(result.summary).toContain('API timeout');
    });
});

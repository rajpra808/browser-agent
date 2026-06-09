"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
// Must reset config cache + mock before importing logger
vitest_1.vi.mock('../config', () => ({
    getConfig: vitest_1.vi.fn(),
}));
const config_1 = require("../config");
const logger_1 = require("./logger");
function makeTmpLogDir() {
    return fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'ba-logger-'));
}
function setupConfig(logDir) {
    config_1.getConfig.mockReturnValue({
        logging: { dir: logDir },
    });
}
(0, vitest_1.describe)('logStep', () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpLogDir();
        setupConfig(tmpDir);
    });
    (0, vitest_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('creates logger.csv with header on first call', () => {
        const entry = {
            taskId: 'task1',
            step: 1,
            provider: 'claude-api',
            action: { action: 'click', id: 4, reason: 'test' },
            outcome: 'success',
            durationMs: 500,
        };
        (0, logger_1.logStep)(entry);
        const csvPath = path_1.default.join(tmpDir, 'logger.csv');
        (0, vitest_1.expect)(fs_1.default.existsSync(csvPath)).toBe(true);
        const content = fs_1.default.readFileSync(csvPath, 'utf8');
        (0, vitest_1.expect)(content.startsWith('timestamp,task_id,step,provider,action,')).toBe(true);
    });
    (0, vitest_1.it)('appends a row for click action with element id', () => {
        const entry = {
            taskId: 'abc',
            step: 2,
            provider: 'gemini',
            action: { action: 'click', id: 42, reason: 'click button' },
            outcome: 'success',
            durationMs: 123,
        };
        (0, logger_1.logStep)(entry);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('click');
        (0, vitest_1.expect)(content).toContain('42');
        (0, vitest_1.expect)(content).toContain('click button');
        (0, vitest_1.expect)(content).toContain('gemini');
    });
    (0, vitest_1.it)('appends a row for type action with text', () => {
        const entry = {
            taskId: 'abc',
            step: 1,
            provider: 'openai',
            action: { action: 'type', text: 'hello world', reason: 'fill input' },
            outcome: 'success',
            durationMs: 50,
        };
        (0, logger_1.logStep)(entry);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('type');
        (0, vitest_1.expect)(content).toContain('hello world');
    });
    (0, vitest_1.it)('includes error info in outcome column', () => {
        const entry = {
            taskId: 'err1',
            step: 1,
            provider: 'ollama',
            action: { action: 'click', id: 0, reason: 'test' },
            outcome: 'error',
            error: 'element stale',
            durationMs: 10,
        };
        (0, logger_1.logStep)(entry);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('error');
        (0, vitest_1.expect)(content).toContain('element stale');
    });
    (0, vitest_1.it)('escapes commas in text field with quotes', () => {
        const entry = {
            taskId: 'q1',
            step: 1,
            provider: 'claude-api',
            action: { action: 'type', text: 'hello, world', reason: 'comma test' },
            outcome: 'success',
            durationMs: 10,
        };
        (0, logger_1.logStep)(entry);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('"hello, world"');
    });
    (0, vitest_1.it)('appends multiple rows without overwriting', () => {
        const base = {
            taskId: 'multi',
            step: 1,
            provider: 'claude-api',
            action: { action: 'wait', ms: 100, reason: 'wait' },
            outcome: 'success',
            durationMs: 100,
        };
        (0, logger_1.logStep)(base);
        (0, logger_1.logStep)({ ...base, step: 2 });
        (0, logger_1.logStep)({ ...base, step: 3 });
        const lines = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8').trim().split('\n');
        (0, vitest_1.expect)(lines.length).toBe(4); // header + 3 rows
    });
    (0, vitest_1.it)('logs scroll action with direction and pixels', () => {
        const entry = {
            taskId: 's1',
            step: 1,
            provider: 'claude-api',
            action: { action: 'scroll', direction: 'up', pixels: 500, reason: 'scroll up' },
            outcome: 'success',
            durationMs: 20,
        };
        (0, logger_1.logStep)(entry);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('scroll');
        (0, vitest_1.expect)(content).toContain('up');
        (0, vitest_1.expect)(content).toContain('500');
    });
    (0, vitest_1.it)('logs done action with summary as reason', () => {
        const entry = {
            taskId: 'd1',
            step: 5,
            provider: 'claude-api',
            action: { action: 'done', summary: 'task finished' },
            outcome: 'success',
            durationMs: 1000,
        };
        (0, logger_1.logStep)(entry);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'logger.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('done');
        (0, vitest_1.expect)(content).toContain('task finished');
    });
});

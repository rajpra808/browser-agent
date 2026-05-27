"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
vitest_1.vi.mock('../config', () => ({
    getConfig: vitest_1.vi.fn(),
}));
const config_1 = require("../config");
const stats_1 = require("./stats");
function makeTmpDir() {
    return fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'ba-stats-'));
}
function setupConfig(logDir) {
    config_1.getConfig.mockReturnValue({
        logging: { dir: logDir },
    });
}
const base = {
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
(0, vitest_1.describe)('logStats', () => {
    let tmpDir;
    (0, vitest_1.beforeEach)(() => {
        tmpDir = makeTmpDir();
        setupConfig(tmpDir);
    });
    (0, vitest_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('creates stats.csv with header on first call', () => {
        (0, stats_1.logStats)(base);
        const csvPath = path_1.default.join(tmpDir, 'stats.csv');
        (0, vitest_1.expect)(fs_1.default.existsSync(csvPath)).toBe(true);
        const content = fs_1.default.readFileSync(csvPath, 'utf8');
        (0, vitest_1.expect)(content.startsWith('task_id,timestamp,task,account,provider,')).toBe(true);
    });
    (0, vitest_1.it)('writes task_id, task, account, provider in row', () => {
        (0, stats_1.logStats)(base);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('task-xyz');
        (0, vitest_1.expect)(content).toContain('default');
        (0, vitest_1.expect)(content).toContain('claude-api');
    });
    (0, vitest_1.it)('writes correct duration_ms (30000 for 30s)', () => {
        (0, stats_1.logStats)(base);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('30000');
    });
    (0, vitest_1.it)('writes outcome "done"', () => {
        (0, stats_1.logStats)(base);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain(',done,');
    });
    (0, vitest_1.it)('writes outcome "failed"', () => {
        (0, stats_1.logStats)({ ...base, outcome: 'failed', summary: 'could not find element' });
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain(',failed,');
    });
    (0, vitest_1.it)('writes outcome "max_steps"', () => {
        (0, stats_1.logStats)({ ...base, outcome: 'max_steps', summary: 'gave up after 30 steps' });
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain(',max_steps,');
    });
    (0, vitest_1.it)('writes steps_total count', () => {
        (0, stats_1.logStats)({ ...base, stepsTotal: 7 });
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain(',7,');
    });
    (0, vitest_1.it)('appends multiple rows without overwriting', () => {
        (0, stats_1.logStats)(base);
        (0, stats_1.logStats)({ ...base, taskId: 'task-2' });
        (0, stats_1.logStats)({ ...base, taskId: 'task-3' });
        const lines = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8').trim().split('\n');
        (0, vitest_1.expect)(lines.length).toBe(4); // header + 3 rows
    });
    (0, vitest_1.it)('escapes commas in task description', () => {
        (0, stats_1.logStats)({ ...base, task: 'Go to google, then search cats, then scroll' });
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('"Go to google, then search cats, then scroll"');
    });
    (0, vitest_1.it)('writes summary text', () => {
        (0, stats_1.logStats)(base);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, 'stats.csv'), 'utf8');
        (0, vitest_1.expect)(content).toContain('Searched for cats successfully');
    });
    (0, vitest_1.it)('creates logs directory if it does not exist', () => {
        const nestedDir = path_1.default.join(tmpDir, 'deep', 'nested', 'logs');
        setupConfig(nestedDir);
        (0, stats_1.logStats)(base);
        (0, vitest_1.expect)(fs_1.default.existsSync(path_1.default.join(nestedDir, 'stats.csv'))).toBe(true);
    });
});

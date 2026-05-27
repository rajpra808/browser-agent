"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const config_1 = require("./config");
const HOME_BASE = path_1.default.join(os_1.default.homedir(), '.browser-agent');
(0, vitest_1.describe)('_resolveEnvVars', () => {
    (0, vitest_1.it)('replaces ${VAR} with env value', () => {
        process.env.TEST_RESOLVE_VAR = 'my-key';
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)('${TEST_RESOLVE_VAR}')).toBe('my-key');
        delete process.env.TEST_RESOLVE_VAR;
    });
    (0, vitest_1.it)('replaces multiple vars in a string', () => {
        process.env.A_VAR = 'hello';
        process.env.B_VAR = 'world';
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)('${A_VAR} ${B_VAR}')).toBe('hello world');
        delete process.env.A_VAR;
        delete process.env.B_VAR;
    });
    (0, vitest_1.it)('returns empty string for missing env var', () => {
        delete process.env.MISSING_VAR_XYZ;
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)('${MISSING_VAR_XYZ}')).toBe('');
    });
    (0, vitest_1.it)('resolves nested object values', () => {
        process.env.NESTED_KEY = 'secret';
        const result = (0, config_1._resolveEnvVars)({ a: '${NESTED_KEY}', b: { c: '${NESTED_KEY}' } });
        (0, vitest_1.expect)(result['a']).toBe('secret');
        (0, vitest_1.expect)(result['b']['c']).toBe('secret');
        delete process.env.NESTED_KEY;
    });
    (0, vitest_1.it)('resolves values inside arrays', () => {
        process.env.ARR_VAR = 'val';
        const result = (0, config_1._resolveEnvVars)(['${ARR_VAR}', 'plain']);
        (0, vitest_1.expect)(result[0]).toBe('val');
        (0, vitest_1.expect)(result[1]).toBe('plain');
        delete process.env.ARR_VAR;
    });
    (0, vitest_1.it)('passes through non-string primitives unchanged', () => {
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)(42)).toBe(42);
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)(true)).toBe(true);
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)(null)).toBe(null);
    });
    (0, vitest_1.it)('does not alter string without ${} patterns', () => {
        (0, vitest_1.expect)((0, config_1._resolveEnvVars)('plain string')).toBe('plain string');
    });
});
(0, vitest_1.describe)('getConfig', () => {
    let tmpDir;
    const origCwd = process.cwd();
    (0, vitest_1.beforeEach)(() => {
        (0, config_1._resetConfigCache)();
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'ba-test-'));
        process.chdir(tmpDir);
    });
    (0, vitest_1.afterEach)(() => {
        process.chdir(origCwd);
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        (0, config_1._resetConfigCache)();
        // Clean env vars set in tests
        delete process.env.BROWSER_AGENT_PROVIDER;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GEMINI_API_KEY;
        delete process.env.OPENAI_API_KEY;
    });
    (0, vitest_1.it)('returns defaults when no config file present', () => {
        const config = (0, config_1.getConfig)();
        (0, vitest_1.expect)(config.provider).toBe('claude-api');
        (0, vitest_1.expect)(config.browser.headless).toBe(false);
        (0, vitest_1.expect)(config.browser.viewport).toEqual({ width: 1280, height: 800 });
        (0, vitest_1.expect)(config.agent.maxSteps).toBe(30);
        (0, vitest_1.expect)(config.agent.stepDelayMs).toBe(500);
        // Global install defaults point to ~/.browser-agent/
        (0, vitest_1.expect)(config.logging.dir).toBe(path_1.default.join(HOME_BASE, 'logs'));
        (0, vitest_1.expect)(config.browser.sessionDir).toBe(path_1.default.join(HOME_BASE, 'sessions'));
    });
    (0, vitest_1.it)('loads config file and overrides defaults', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'browser-agent.config.json'), JSON.stringify({ provider: 'gemini', agent: { maxSteps: 10, stepDelayMs: 200 } }));
        const config = (0, config_1.getConfig)();
        (0, vitest_1.expect)(config.provider).toBe('gemini');
        (0, vitest_1.expect)(config.agent.maxSteps).toBe(10);
        (0, vitest_1.expect)(config.agent.stepDelayMs).toBe(200);
    });
    (0, vitest_1.it)('BROWSER_AGENT_PROVIDER env overrides config file provider', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'browser-agent.config.json'), JSON.stringify({ provider: 'gemini' }));
        process.env.BROWSER_AGENT_PROVIDER = 'ollama';
        const config = (0, config_1.getConfig)();
        (0, vitest_1.expect)(config.provider).toBe('ollama');
    });
    (0, vitest_1.it)('injects ANTHROPIC_API_KEY into claude-api provider', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-test-123';
        const config = (0, config_1.getConfig)();
        const providers = config.providers;
        (0, vitest_1.expect)(providers['claude-api']?.apiKey).toBe('sk-test-123');
    });
    (0, vitest_1.it)('injects GEMINI_API_KEY into gemini provider', () => {
        process.env.GEMINI_API_KEY = 'gemini-key-456';
        const config = (0, config_1.getConfig)();
        const providers = config.providers;
        (0, vitest_1.expect)(providers['gemini']?.apiKey).toBe('gemini-key-456');
    });
    (0, vitest_1.it)('injects OPENAI_API_KEY into openai provider', () => {
        process.env.OPENAI_API_KEY = 'openai-key-789';
        const config = (0, config_1.getConfig)();
        const providers = config.providers;
        (0, vitest_1.expect)(providers['openai']?.apiKey).toBe('openai-key-789');
    });
    (0, vitest_1.it)('caches result across calls', () => {
        const c1 = (0, config_1.getConfig)();
        const c2 = (0, config_1.getConfig)();
        (0, vitest_1.expect)(c1).toBe(c2);
    });
    (0, vitest_1.it)('resolves ${VAR} syntax in config file values', () => {
        process.env.MY_PROVIDER_KEY = 'resolved-key';
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'browser-agent.config.json'), JSON.stringify({ providers: { 'claude-api': { apiKey: '${MY_PROVIDER_KEY}' } } }));
        const config = (0, config_1.getConfig)();
        const providers = config.providers;
        (0, vitest_1.expect)(providers['claude-api']?.apiKey).toBe('resolved-key');
        delete process.env.MY_PROVIDER_KEY;
    });
});

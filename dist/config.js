"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._resolveEnvVars = _resolveEnvVars;
exports._resetConfigCache = _resetConfigCache;
exports.getConfig = getConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GLOBAL_BASE = path_1.default.join(os_1.default.homedir(), '.browser-agent');
function str(v, fallback) {
    return typeof v === 'string' && v.length > 0 ? v : fallback;
}
function num(v, fallback) {
    return typeof v === 'number' && isFinite(v) ? v : fallback;
}
function bool(v, fallback) {
    return typeof v === 'boolean' ? v : fallback;
}
function parseProviders(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return {};
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const p = v;
            out[k] = {
                ...(typeof p['model'] === 'string' ? { model: p['model'] } : {}),
                ...(typeof p['apiKey'] === 'string' ? { apiKey: p['apiKey'] } : {}),
                ...(typeof p['baseUrl'] === 'string' ? { baseUrl: p['baseUrl'] } : {}),
            };
        }
    }
    return out;
}
function defaultHeadless() {
    if (process.platform !== 'linux')
        return false;
    return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
}
function parseConfig(raw) {
    const browser = (raw['browser'] ?? {});
    const viewport = (browser['viewport'] ?? {});
    const agent = (raw['agent'] ?? {});
    const logging = (raw['logging'] ?? {});
    return {
        provider: str(raw['provider'], 'claude-api'),
        providers: parseProviders(raw['providers']),
        browser: {
            headless: bool(browser['headless'], defaultHeadless()),
            sessionDir: str(browser['sessionDir'], path_1.default.join(GLOBAL_BASE, 'sessions')),
            defaultAccount: str(browser['defaultAccount'], 'default'),
            viewport: {
                width: num(viewport['width'], 1280),
                height: num(viewport['height'], 800),
            },
        },
        agent: {
            maxSteps: num(agent['maxSteps'], 30),
            stepDelayMs: num(agent['stepDelayMs'], 500),
        },
        logging: {
            dir: str(logging['dir'], path_1.default.join(GLOBAL_BASE, 'logs')),
        },
    };
}
function resolveEnvVars(obj) {
    if (typeof obj === 'string') {
        return obj.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] ?? '');
    }
    if (Array.isArray(obj))
        return obj.map(resolveEnvVars);
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, resolveEnvVars(v)]));
    }
    return obj;
}
function loadConfigFile() {
    const candidates = [
        path_1.default.join(process.cwd(), 'browser-agent.config.json'),
        path_1.default.join(process.env.HOME ?? '', '.browser-agent', 'config.json'),
    ];
    for (const p of candidates) {
        if (fs_1.default.existsSync(p)) {
            return JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
        }
    }
    return {};
}
let cached = null;
function _resolveEnvVars(obj) {
    return resolveEnvVars(obj);
}
function _resetConfigCache() {
    cached = null;
}
function getConfig() {
    if (cached)
        return cached;
    const raw = resolveEnvVars(loadConfigFile());
    const config = parseConfig(raw);
    if (process.env.BROWSER_AGENT_PROVIDER) {
        config.provider = process.env.BROWSER_AGENT_PROVIDER;
    }
    if (process.env.ANTHROPIC_API_KEY) {
        config.providers['claude-api'] = { ...(config.providers['claude-api'] ?? {}), apiKey: process.env.ANTHROPIC_API_KEY };
    }
    if (process.env.GEMINI_API_KEY) {
        config.providers['gemini'] = { ...(config.providers['gemini'] ?? {}), apiKey: process.env.GEMINI_API_KEY };
    }
    if (process.env.OPENAI_API_KEY) {
        config.providers['openai'] = { ...(config.providers['openai'] ?? {}), apiKey: process.env.OPENAI_API_KEY };
    }
    cached = config;
    return cached;
}

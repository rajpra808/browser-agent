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
const zod_1 = require("zod");
dotenv_1.default.config();
const GLOBAL_BASE = path_1.default.join(os_1.default.homedir(), '.browser-agent');
const ProviderConfigSchema = zod_1.z.object({
    model: zod_1.z.string().optional(),
    apiKey: zod_1.z.string().optional(),
    baseUrl: zod_1.z.string().optional(),
});
const ViewportSchema = zod_1.z.object({
    width: zod_1.z.number(),
    height: zod_1.z.number(),
}).default({ width: 1280, height: 800 });
const BrowserSchema = zod_1.z.object({
    headless: zod_1.z.boolean().default(false),
    sessionDir: zod_1.z.string().default('./sessions'),
    defaultAccount: zod_1.z.string().default('default'),
    viewport: ViewportSchema,
}).default(() => ({
    headless: false,
    sessionDir: path_1.default.join(GLOBAL_BASE, 'sessions'),
    defaultAccount: 'default',
    viewport: { width: 1280, height: 800 },
}));
const AgentSchema = zod_1.z.object({
    maxSteps: zod_1.z.number().default(30),
    stepDelayMs: zod_1.z.number().default(500),
}).default({ maxSteps: 30, stepDelayMs: 500 });
const LoggingSchema = zod_1.z.object({
    dir: zod_1.z.string().default('./logs'),
}).default(() => ({ dir: path_1.default.join(GLOBAL_BASE, 'logs') }));
const ConfigSchema = zod_1.z.object({
    provider: zod_1.z.string().default('claude-api'),
    providers: zod_1.z.record(ProviderConfigSchema).default({}),
    browser: BrowserSchema,
    agent: AgentSchema,
    logging: LoggingSchema,
});
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
    const parsed = ConfigSchema.parse(raw);
    if (process.env.BROWSER_AGENT_PROVIDER) {
        parsed.provider = process.env.BROWSER_AGENT_PROVIDER;
    }
    // Inject env-sourced API keys, preserving any config-file values
    const providers = parsed.providers;
    if (process.env.ANTHROPIC_API_KEY) {
        providers['claude-api'] = { ...(providers['claude-api'] ?? {}), apiKey: process.env.ANTHROPIC_API_KEY };
    }
    if (process.env.GEMINI_API_KEY) {
        providers['gemini'] = { ...(providers['gemini'] ?? {}), apiKey: process.env.GEMINI_API_KEY };
    }
    if (process.env.OPENAI_API_KEY) {
        providers['openai'] = { ...(providers['openai'] ?? {}), apiKey: process.env.OPENAI_API_KEY };
    }
    cached = parsed;
    return cached;
}

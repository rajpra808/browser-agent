"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserContext = getBrowserContext;
exports.getActivePage = getActivePage;
exports.closeBrowserContext = closeBrowserContext;
const playwright_1 = require("playwright");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const contexts = new Map();
async function getBrowserContext(account) {
    const existing = contexts.get(account);
    if (existing)
        return existing;
    const config = (0, config_1.getConfig)();
    const sessionDir = path_1.default.resolve(config.browser.sessionDir, account);
    if (!fs_1.default.existsSync(sessionDir)) {
        fs_1.default.mkdirSync(sessionDir, { recursive: true });
    }
    const context = await playwright_1.chromium.launchPersistentContext(sessionDir, {
        headless: config.browser.headless,
        viewport: config.browser.viewport,
        args: ['--no-sandbox'],
    });
    contexts.set(account, context);
    return context;
}
async function getActivePage(account) {
    const context = await getBrowserContext(account);
    const pages = context.pages();
    // Reuse last open non-closed page, or open a new one
    let page;
    for (let i = pages.length - 1; i >= 0; i--) {
        if (!pages[i].isClosed()) {
            page = pages[i];
            break;
        }
    }
    if (!page) {
        page = await context.newPage();
    }
    return { context, page };
}
async function closeBrowserContext(account) {
    const ctx = contexts.get(account);
    if (ctx) {
        await ctx.close();
        contexts.delete(account);
    }
}

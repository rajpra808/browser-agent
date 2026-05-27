#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const readline_1 = __importDefault(require("readline"));
const agent_1 = require("./agent");
const instance_1 = require("./browser/instance");
const program = new commander_1.Command();
program
    .name('browser-agent')
    .description('Vision-based browser automation with multi-LLM support')
    .version('1.0.0');
program
    .command('run <task>')
    .description('Run a task using the AI agent')
    .option('-a, --account <name>', 'Named session account', 'default')
    .option('-p, --provider <name>', 'AI provider: claude-api | gemini | openai | ollama | claude-code')
    .option('-s, --max-steps <n>', 'Max steps before giving up', (v) => parseInt(v, 10))
    .action(async (task, opts) => {
    try {
        await (0, agent_1.runTask)({ task, account: opts.account, provider: opts.provider, maxSteps: opts.maxSteps });
        process.exit(0);
    }
    catch (err) {
        console.error('[browser-agent] fatal:', err);
        process.exit(1);
    }
});
program
    .command('login')
    .description('Open browser for manual login (no AI). Session is saved on exit.')
    .option('-a, --account <name>', 'Named session account', 'default')
    .action(async (opts) => {
    console.log(`\n[browser-agent] Opening browser for account: "${opts.account}"`);
    console.log('[browser-agent] Log in manually, then press Enter here to save & close.\n');
    const { page } = await (0, instance_1.getActivePage)(opts.account);
    if (page.url() === 'about:blank') {
        await page.goto('https://www.google.com').catch(() => null);
    }
    const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
    await new Promise((resolve) => {
        rl.question('Press Enter when done... ', () => {
            rl.close();
            resolve();
        });
    });
    await (0, instance_1.closeBrowserContext)(opts.account);
    console.log(`\n[browser-agent] Session saved → sessions/${opts.account}/`);
    process.exit(0);
});
program.parse();

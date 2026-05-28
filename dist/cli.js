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
const index_1 = require("./providers/index");
const config_1 = require("./config");
const program = new commander_1.Command();
program
    .name('browser-agent')
    .description('Vision-based browser automation — LLM sees screenshot, clicks coordinates, no selectors')
    .version('1.3.0')
    .addHelpText('after', `
Providers: claude-api | gemini | openai | ollama | claude-code

Quick start:
  export ANTHROPIC_API_KEY=sk-ant-...
  browser-agent run "Go to google.com and search for cats" --provider claude-api

  export GEMINI_API_KEY=AIza...
  browser-agent run "Go to google.com" --provider gemini --model gemini-1.5-pro

  browser-agent run "Open Hacker News" --provider ollama --model llava:7b

  browser-agent login --account twitter_main
  browser-agent run "Like the first tweet" --account twitter_main --provider claude-api

Docs: https://github.com/rajpra808/browser-agent`);
program
    .command('run <task>')
    .description('Run a task using the AI agent')
    .option('-a, --account <name>', 'Named session account', 'default')
    .option('-p, --provider <name>', `AI provider (${index_1.PROVIDERS.join(' | ')})`)
    .option('-m, --model <model>', 'Model to use (overrides config default)')
    .option('-s, --max-steps <n>', 'Max steps before giving up', (v) => parseInt(v, 10))
    .addHelpText('after', `
Examples:
  browser-agent run "search for cats on google" --provider claude-api
  browser-agent run "search for cats on google" --provider gemini --model gemini-1.5-pro
  browser-agent run "search for cats on google" --provider ollama --model llava:7b
  browser-agent run "search for cats on google" --provider openai --model gpt-4o`)
    .action(async (task, opts) => {
    let code = 0;
    try {
        await (0, agent_1.runTask)({ task, account: opts.account, provider: opts.provider, model: opts.model, maxSteps: opts.maxSteps });
    }
    catch (err) {
        console.error('[browser-agent] fatal:', err instanceof Error ? err.message : err);
        code = 1;
    }
    finally {
        try {
            await (0, instance_1.closeBrowserContext)(opts.account);
        }
        catch { }
    }
    process.exit(code);
});
program
    .command('login')
    .description('Open browser for manual login (no AI) — session saved on exit')
    .option('-a, --account <name>', 'Named session account', 'default')
    .addHelpText('after', `
Example:
  browser-agent login --account instagram_main
  # Browser opens → log in → press Enter → session saved to sessions/instagram_main/`)
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
program
    .command('models [provider]')
    .description('List available models (all providers, or a specific one)')
    .option('-u, --base-url <url>', 'Ollama base URL', 'http://localhost:11434')
    .addHelpText('after', `
Examples:
  browser-agent models
  browser-agent models claude-api
  browser-agent models ollama`)
    .action(async (provider, opts) => {
    const baseUrl = opts?.baseUrl ?? 'http://localhost:11434';
    const config = (0, config_1.getConfig)();
    const targets = provider ? [provider] : index_1.PROVIDERS;
    for (const p of targets) {
        if (!index_1.PROVIDERS.includes(p)) {
            console.error(`Unknown provider: "${p}". Valid: ${index_1.PROVIDERS.join(', ')}`);
            process.exit(1);
        }
        const apiKey = config.providers?.[p]?.apiKey;
        const models = await (0, index_1.listModels)(p, { baseUrl, apiKey });
        const defaultModel = config.providers?.[p]?.model ?? Object.values(index_1.PROVIDER_MODELS[p] ?? [])[0] ?? 'n/a';
        console.log(`\n${p}  (default: ${defaultModel})`);
        if (models.length === 0) {
            console.log('  (no models listed)');
        }
        else {
            models.forEach(m => console.log(`  ${m}`));
        }
    }
    console.log('');
    process.exit(0);
});
program.parse();

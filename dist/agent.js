"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTask = runTask;
const config_1 = require("./config");
const index_1 = require("./providers/index");
const instance_1 = require("./browser/instance");
const actions_1 = require("./browser/actions");
const logger_1 = require("./logging/logger");
const stats_1 = require("./logging/stats");
function taskId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
async function runTask(options) {
    const config = (0, config_1.getConfig)();
    const account = options.account ?? config.browser.defaultAccount;
    const providerName = options.provider ?? config.provider;
    const maxSteps = options.maxSteps ?? config.agent.maxSteps;
    const providerConfig = { ...(config.providers[providerName] ?? {}), ...(options.model ? { model: options.model } : {}) };
    const provider = (0, index_1.createProvider)(providerName, providerConfig);
    const id = taskId();
    const startTime = new Date();
    console.log(`\n[browser-agent] task   : ${options.task}`);
    const modelLabel = providerConfig.model ?? '(default)';
    console.log(`[browser-agent] account: ${account}  provider: ${providerName}  model: ${modelLabel}  max-steps: ${maxSteps}\n`);
    const { page } = await (0, instance_1.getActivePage)(account);
    const history = [];
    let outcome = 'max_steps';
    let summary = 'Max steps reached without completion';
    for (let step = 1; step <= maxSteps; step++) {
        const pageUrl = page.url();
        console.log(`[step ${step}/${maxSteps}] screenshot → LLM  (url: ${pageUrl})`);
        // Screenshot
        let screenshotB64;
        try {
            screenshotB64 = await (0, actions_1.screenshot)(page);
        }
        catch (err) {
            console.error(`[step ${step}] screenshot failed:`, err);
            break;
        }
        // LLM decision
        const llmStart = Date.now();
        let action;
        try {
            action = await provider.decideAction(options.task, screenshotB64, history, pageUrl);
        }
        catch (err) {
            console.error(`[step ${step}] LLM error:`, err);
            action = { action: 'failed', reason: `LLM error: ${String(err)}` };
        }
        const llmMs = Date.now() - llmStart;
        console.log(`[step ${step}] action : ${JSON.stringify(action)}`);
        // Terminal states
        if (action.action === 'done') {
            outcome = 'done';
            summary = action.summary;
            (0, logger_1.logStep)({ taskId: id, step, provider: providerName, action, outcome: 'success', durationMs: llmMs });
            history.push({ step, action, outcome: 'success' });
            break;
        }
        if (action.action === 'failed') {
            outcome = 'failed';
            summary = action.reason;
            (0, logger_1.logStep)({ taskId: id, step, provider: providerName, action, outcome: 'error', durationMs: llmMs });
            history.push({ step, action, outcome: 'error' });
            break;
        }
        // Execute
        const execStart = Date.now();
        let execOutcome = 'success';
        let execError;
        try {
            await executeAction(page, action);
        }
        catch (err) {
            execOutcome = 'error';
            execError = String(err);
            console.error(`[step ${step}] execute error:`, err);
        }
        (0, logger_1.logStep)({
            taskId: id,
            step,
            provider: providerName,
            action,
            outcome: execOutcome,
            error: execError,
            durationMs: Date.now() - execStart + llmMs,
        });
        history.push({ step, action, outcome: execOutcome, error: execError });
        if (step < maxSteps) {
            await (0, actions_1.wait)(config.agent.stepDelayMs);
        }
    }
    const endTime = new Date();
    (0, stats_1.logStats)({
        taskId: id,
        task: options.task,
        account,
        provider: providerName,
        stepsTotal: history.length,
        outcome,
        startTime,
        endTime,
        summary,
    });
    const durationSec = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(1);
    console.log(`\n[browser-agent] ${outcome.toUpperCase()} in ${durationSec}s — ${summary}`);
    console.log(`[browser-agent] logs/logger.csv  |  logs/stats.csv\n`);
    return { outcome, summary };
}
async function executeAction(page, action) {
    switch (action.action) {
        case 'click':
            await (0, actions_1.click)(page, action.x, action.y);
            break;
        case 'type':
            await (0, actions_1.typeText)(page, action.text);
            break;
        case 'scroll':
            await (0, actions_1.scroll)(page, action.direction, action.pixels);
            break;
        case 'key':
            await (0, actions_1.pressKey)(page, action.key);
            break;
        case 'wait':
            await (0, actions_1.wait)(action.ms);
            break;
    }
}

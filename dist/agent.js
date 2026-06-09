"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTask = runTask;
const config_1 = require("./config");
const index_1 = require("./providers/index");
const instance_1 = require("./browser/instance");
const actions_1 = require("./browser/actions");
const marks_1 = require("./browser/marks");
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
    const { page } = await (0, instance_1.getActivePage)(account, { headless: options.headless });
    if (page.url() === 'about:blank') {
        await page.goto('data:text/html,<!doctype html><html><body></body></html>').catch(() => { });
    }
    const history = [];
    let outcome = 'max_steps';
    let summary = 'Max steps reached without completion';
    let noProgress = 0;
    for (let step = 1; step <= maxSteps; step++) {
        const pageUrl = page.url();
        console.log(`[step ${step}/${maxSteps}] screenshot → LLM  (url: ${pageUrl})`);
        // Annotate interactive elements, screenshot, then strip overlays (keep ids).
        let screenshotB64;
        let marks;
        try {
            marks = await (0, marks_1.annotatePage)(page).catch(() => []);
            screenshotB64 = await (0, actions_1.screenshot)(page);
        }
        catch (err) {
            console.error(`[step ${step}] screenshot failed:`, err);
            break;
        }
        finally {
            await (0, marks_1.clearMarks)(page);
        }
        // LLM decision
        const llmStart = Date.now();
        let action;
        try {
            action = await provider.decideAction(options.task, screenshotB64, history, pageUrl, marks);
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
        const focusBefore = await describeFocus(page);
        try {
            await executeAction(page, action);
        }
        catch (err) {
            execOutcome = 'error';
            execError = String(err);
            console.error(`[step ${step}] execute error:`, err);
        }
        // Feedback: what changed after the action (url + focused element).
        if (step < maxSteps) {
            await (0, actions_1.wait)(config.agent.stepDelayMs);
        }
        const urlAfter = page.url();
        const focusAfter = await describeFocus(page);
        const urlChanged = urlAfter !== pageUrl;
        const focusChanged = focusAfter !== focusBefore;
        const fbParts = [];
        if (urlChanged)
            fbParts.push(`URL → ${urlAfter}`);
        if (focusChanged)
            fbParts.push(`focused: ${focusAfter || 'none'}`);
        if (execOutcome === 'error')
            fbParts.push('action errored');
        const interactive = ['click', 'double_click', 'right_click', 'hover', 'type', 'key', 'clear'].includes(action.action);
        if (interactive && !urlChanged && !focusChanged && execOutcome === 'success') {
            noProgress++;
            fbParts.push('no visible change — last action likely missed; try a different element');
        }
        else {
            noProgress = 0;
        }
        const feedback = fbParts.join('; ') || 'no change detected';
        (0, logger_1.logStep)({
            taskId: id,
            step,
            provider: providerName,
            action,
            outcome: execOutcome,
            error: execError,
            durationMs: Date.now() - execStart + llmMs,
        });
        history.push({ step, action, outcome: execOutcome, error: execError, feedback });
        if (noProgress >= 5) {
            outcome = 'failed';
            summary = 'Stuck: 5 consecutive actions had no effect (elements may be misidentified).';
            console.error(`[step ${step}] aborting — ${summary}`);
            break;
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
async function describeFocus(page) {
    return page
        .evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body)
            return '';
        const name = el.getAttribute('aria-label') ||
            el.placeholder ||
            el.value ||
            el.getAttribute('name') ||
            (el.textContent || '').trim();
        return `${el.tagName.toLowerCase()}${name ? `[${name.slice(0, 30)}]` : ''}`;
    })
        .catch(() => '');
}
async function executeAction(page, action) {
    switch (action.action) {
        case 'navigate':
            await (0, actions_1.navigate)(page, action.url);
            break;
        case 'click':
            await (0, actions_1.clickElement)(page, action.id);
            break;
        case 'double_click':
            await (0, actions_1.doubleClickElement)(page, action.id);
            break;
        case 'right_click':
            await (0, actions_1.rightClickElement)(page, action.id);
            break;
        case 'hover':
            await (0, actions_1.hoverElement)(page, action.id);
            break;
        case 'drag':
            await (0, actions_1.drag)(page, action.fromX, action.fromY, action.toX, action.toY);
            break;
        case 'type':
            await (0, actions_1.typeText)(page, action.text, action.id);
            break;
        case 'clear':
            await (0, actions_1.clearField)(page);
            break;
        case 'key':
            await (0, actions_1.pressKey)(page, action.key);
            break;
        case 'scroll':
            await (0, actions_1.scroll)(page, action.direction, action.pixels);
            break;
        case 'back':
            await (0, actions_1.goBack)(page);
            break;
        case 'forward':
            await (0, actions_1.goForward)(page);
            break;
        case 'reload':
            await (0, actions_1.reload)(page);
            break;
        case 'wait':
            await (0, actions_1.wait)(action.ms);
            break;
        case 'save_screenshot': {
            const saved = await (0, actions_1.saveScreenshot)(page, action.path);
            console.log(`           saved screenshot → ${saved}`);
            break;
        }
    }
}

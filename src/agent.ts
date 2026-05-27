import { Page } from 'playwright';
import { getConfig } from './config';
import { createProvider } from './providers/index';
import { ActionHistory, BrowserAction } from './providers/base';
import { getActivePage } from './browser/instance';
import { screenshot, click, typeText, scroll, pressKey, wait } from './browser/actions';
import { logStep } from './logging/logger';
import { logStats } from './logging/stats';

function taskId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

export interface RunOptions {
  task: string;
  account?: string;
  provider?: string;
  model?: string;
  maxSteps?: number;
}

export interface RunResult {
  outcome: 'done' | 'failed' | 'max_steps';
  summary: string;
}

export async function runTask(options: RunOptions): Promise<RunResult> {
  const config = getConfig();
  const account = options.account ?? config.browser.defaultAccount;
  const providerName = options.provider ?? config.provider;
  const maxSteps = options.maxSteps ?? config.agent.maxSteps;

  const providerConfig = { ...(config.providers[providerName] ?? {}), ...(options.model ? { model: options.model } : {}) };
  const provider = createProvider(providerName, providerConfig);
  const id = taskId();
  const startTime = new Date();

  console.log(`\n[browser-agent] task   : ${options.task}`);
  const modelLabel = providerConfig.model ?? '(default)';
  console.log(`[browser-agent] account: ${account}  provider: ${providerName}  model: ${modelLabel}  max-steps: ${maxSteps}\n`);

  const { page } = await getActivePage(account);
  const history: ActionHistory[] = [];
  let outcome: RunResult['outcome'] = 'max_steps';
  let summary = 'Max steps reached without completion';

  for (let step = 1; step <= maxSteps; step++) {
    const pageUrl = page.url();
    console.log(`[step ${step}/${maxSteps}] screenshot → LLM  (url: ${pageUrl})`);

    // Screenshot
    let screenshotB64: string;
    try {
      screenshotB64 = await screenshot(page);
    } catch (err) {
      console.error(`[step ${step}] screenshot failed:`, err);
      break;
    }

    // LLM decision
    const llmStart = Date.now();
    let action: BrowserAction;
    try {
      action = await provider.decideAction(options.task, screenshotB64, history, pageUrl);
    } catch (err) {
      console.error(`[step ${step}] LLM error:`, err);
      action = { action: 'failed', reason: `LLM error: ${String(err)}` };
    }
    const llmMs = Date.now() - llmStart;

    console.log(`[step ${step}] action : ${JSON.stringify(action)}`);

    // Terminal states
    if (action.action === 'done') {
      outcome = 'done';
      summary = action.summary;
      logStep({ taskId: id, step, provider: providerName, action, outcome: 'success', durationMs: llmMs });
      history.push({ step, action, outcome: 'success' });
      break;
    }
    if (action.action === 'failed') {
      outcome = 'failed';
      summary = action.reason;
      logStep({ taskId: id, step, provider: providerName, action, outcome: 'error', durationMs: llmMs });
      history.push({ step, action, outcome: 'error' });
      break;
    }

    // Execute
    const execStart = Date.now();
    let execOutcome: 'success' | 'error' = 'success';
    let execError: string | undefined;

    try {
      await executeAction(page, action);
    } catch (err) {
      execOutcome = 'error';
      execError = String(err);
      console.error(`[step ${step}] execute error:`, err);
    }

    logStep({
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
      await wait(config.agent.stepDelayMs);
    }
  }

  const endTime = new Date();
  logStats({
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

async function executeAction(page: Page, action: BrowserAction): Promise<void> {
  switch (action.action) {
    case 'click':
      await click(page, action.x, action.y);
      break;
    case 'type':
      await typeText(page, action.text);
      break;
    case 'scroll':
      await scroll(page, action.direction, action.pixels);
      break;
    case 'key':
      await pressKey(page, action.key);
      break;
    case 'wait':
      await wait(action.ms);
      break;
  }
}

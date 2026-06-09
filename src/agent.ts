import { Page } from 'playwright';
import { getConfig } from './config';
import { createProvider } from './providers/index';
import { ActionHistory, BrowserAction } from './providers/base';
import { getActivePage } from './browser/instance';
import {
  screenshot,
  saveScreenshot,
  clickElement,
  doubleClickElement,
  rightClickElement,
  hoverElement,
  drag,
  typeText,
  clearField,
  scroll,
  pressKey,
  wait,
  navigate,
  goBack,
  goForward,
  reload,
} from './browser/actions';
import { annotatePage, clearMarks } from './browser/marks';
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
  headless?: boolean;
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

  const { page } = await getActivePage(account, { headless: options.headless });
  if (page.url() === 'about:blank') {
    await page.goto('data:text/html,<!doctype html><html><body></body></html>').catch(() => {});
  }
  const history: ActionHistory[] = [];
  let outcome: RunResult['outcome'] = 'max_steps';
  let summary = 'Max steps reached without completion';

  let noProgress = 0;

  for (let step = 1; step <= maxSteps; step++) {
    const pageUrl = page.url();
    console.log(`[step ${step}/${maxSteps}] screenshot → LLM  (url: ${pageUrl})`);

    // Annotate interactive elements, screenshot, then strip overlays (keep ids).
    let screenshotB64: string;
    let marks: Awaited<ReturnType<typeof annotatePage>>;
    try {
      marks = await annotatePage(page).catch(() => []);
      screenshotB64 = await screenshot(page);
    } catch (err) {
      console.error(`[step ${step}] screenshot failed:`, err);
      break;
    } finally {
      await clearMarks(page);
    }

    // LLM decision
    const llmStart = Date.now();
    let action: BrowserAction;
    try {
      action = await provider.decideAction(options.task, screenshotB64, history, pageUrl, marks);
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
    const focusBefore = await describeFocus(page);

    try {
      await executeAction(page, action);
    } catch (err) {
      execOutcome = 'error';
      execError = String(err);
      console.error(`[step ${step}] execute error:`, err);
    }

    // Feedback: what changed after the action (url + focused element).
    if (step < maxSteps) {
      await wait(config.agent.stepDelayMs);
    }
    const urlAfter = page.url();
    const focusAfter = await describeFocus(page);
    const urlChanged = urlAfter !== pageUrl;
    const focusChanged = focusAfter !== focusBefore;

    const fbParts: string[] = [];
    if (urlChanged) fbParts.push(`URL → ${urlAfter}`);
    if (focusChanged) fbParts.push(`focused: ${focusAfter || 'none'}`);
    if (execOutcome === 'error') fbParts.push('action errored');

    const interactive = ['click', 'double_click', 'right_click', 'hover', 'type', 'key', 'clear'].includes(action.action);
    if (interactive && !urlChanged && !focusChanged && execOutcome === 'success') {
      noProgress++;
      fbParts.push('no visible change — last action likely missed; try a different element');
    } else {
      noProgress = 0;
    }
    const feedback = fbParts.join('; ') || 'no change detected';

    logStep({
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

async function describeFocus(page: Page): Promise<string> {
  return page
    .evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return '';
      const name =
        el.getAttribute('aria-label') ||
        (el as HTMLInputElement).placeholder ||
        (el as HTMLInputElement).value ||
        el.getAttribute('name') ||
        (el.textContent || '').trim();
      return `${el.tagName.toLowerCase()}${name ? `[${name.slice(0, 30)}]` : ''}`;
    })
    .catch(() => '');
}

async function executeAction(page: Page, action: BrowserAction): Promise<void> {
  switch (action.action) {
    case 'navigate':     await navigate(page, action.url); break;
    case 'click':        await clickElement(page, action.id); break;
    case 'double_click': await doubleClickElement(page, action.id); break;
    case 'right_click':  await rightClickElement(page, action.id); break;
    case 'hover':        await hoverElement(page, action.id); break;
    case 'drag':         await drag(page, action.fromX, action.fromY, action.toX, action.toY); break;
    case 'type':         await typeText(page, action.text, action.id); break;
    case 'clear':        await clearField(page); break;
    case 'key':          await pressKey(page, action.key); break;
    case 'scroll':       await scroll(page, action.direction, action.pixels); break;
    case 'back':         await goBack(page); break;
    case 'forward':      await goForward(page); break;
    case 'reload':       await reload(page); break;
    case 'wait':         await wait(action.ms); break;
    case 'save_screenshot': {
      const saved = await saveScreenshot(page, action.path);
      console.log(`           saved screenshot → ${saved}`);
      break;
    }
  }
}

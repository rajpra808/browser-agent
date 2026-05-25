export type BrowserAction =
  | { action: 'click'; x: number; y: number; reason: string }
  | { action: 'type'; text: string; reason: string }
  | { action: 'scroll'; direction: 'up' | 'down'; pixels: number; reason: string }
  | { action: 'key'; key: string; reason: string }
  | { action: 'wait'; ms: number; reason: string }
  | { action: 'done'; summary: string }
  | { action: 'failed'; reason: string };

export interface ActionHistory {
  step: number;
  action: BrowserAction;
  outcome: 'success' | 'error';
  error?: string;
}

export interface AIProvider {
  name: string;
  decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl?: string
  ): Promise<BrowserAction>;
}

export const SYSTEM_PROMPT = `You are a browser automation agent. Complete tasks by analyzing browser screenshots and deciding what action to take next.

Rules:
- Examine the screenshot carefully before deciding
- Pick the most logical next step toward completing the task
- Respond with ONLY a JSON object — no markdown, no explanation, no code fences
- Coordinates x and y are pixel positions in the screenshot

Available actions (respond with exactly one):
{"action":"click","x":450,"y":230,"reason":"why you are clicking here"}
{"action":"type","text":"the text to type","reason":"why"}
{"action":"scroll","direction":"down","pixels":300,"reason":"why"}
{"action":"key","key":"Enter","reason":"why"}
{"action":"wait","ms":1000,"reason":"why"}
{"action":"done","summary":"what was accomplished"}
{"action":"failed","reason":"why you cannot complete the task"}`;

export function buildUserMessage(
  task: string,
  history: ActionHistory[],
  pageUrl?: string
): string {
  const urlLine = pageUrl ? `\nCurrent URL: ${pageUrl}` : '';

  const historyText =
    history.length === 0
      ? 'No actions taken yet.'
      : history
          .map((h) => {
            const a = h.action;
            let desc: string;
            switch (a.action) {
              case 'click':   desc = `click(${a.x},${a.y}) — ${a.reason}`; break;
              case 'type':    desc = `type("${a.text}") — ${a.reason}`; break;
              case 'scroll':  desc = `scroll(${a.direction},${a.pixels}px) — ${a.reason}`; break;
              case 'key':     desc = `key(${a.key}) — ${a.reason}`; break;
              case 'wait':    desc = `wait(${a.ms}ms) — ${a.reason}`; break;
              case 'done':    desc = `done: ${a.summary}`; break;
              case 'failed':  desc = `failed: ${a.reason}`; break;
            }
            const status = h.outcome === 'error' ? ` [ERROR: ${h.error}]` : '';
            return `  ${h.step}. ${desc}${status}`;
          })
          .join('\n');

  return `TASK: ${task}${urlLine}

Previous actions:
${historyText}

Look at the screenshot and respond with the next action JSON.`;
}

export function parseAction(raw: string): BrowserAction {
  let s = raw.trim();
  // Strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  try {
    const obj = JSON.parse(s) as Record<string, unknown>;
    if (!obj.action) throw new Error('no action field');
    return obj as unknown as BrowserAction;
  } catch {
    // Find first JSON object containing "action"
    const m = s.match(/\{[^{}]*"action"[^{}]*\}/);
    if (m) {
      const obj = JSON.parse(m[0]) as Record<string, unknown>;
      if (obj.action) return obj as unknown as BrowserAction;
    }
    throw new Error(`Cannot parse action from: ${raw.slice(0, 200)}`);
  }
}

export function getActionReason(action: BrowserAction): string {
  if ('reason' in action) return (action as { reason: string }).reason;
  if ('summary' in action) return (action as { summary: string }).summary;
  return '';
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.buildUserMessage = buildUserMessage;
exports.parseAction = parseAction;
exports.getActionReason = getActionReason;
exports.SYSTEM_PROMPT = `You are a browser automation agent. Complete tasks by analyzing browser screenshots and deciding the next action — like a human using a browser.

The screenshot is 1280x800. Every interactive element (links, buttons, inputs, etc.) is outlined with a colored box and a numbered label. To click, hover, or type into an element, reference it by its "id" number from the ELEMENTS list — NOT pixel coordinates. The id numbers match the labels drawn on the screenshot.

Rules:
- Examine the screenshot AND the ELEMENTS list before deciding.
- To fill a field: pick its id, then type into it. Passing "id" to type focuses that field first, so you don't need a separate click.
- After acting, the next message tells you what changed (URL, focused element). Use that feedback — if nothing changed, your last action missed; pick a different element or strategy, do NOT repeat the same action.
- Respond with ONLY a JSON object — no markdown, no explanation, no code fences.

Available actions (respond with exactly one):
{"action":"navigate","url":"https://example.com","reason":"why"}
{"action":"click","id":5,"reason":"why"}
{"action":"double_click","id":5,"reason":"why"}
{"action":"right_click","id":5,"reason":"why"}
{"action":"hover","id":5,"reason":"why"}
{"action":"drag","fromX":100,"fromY":200,"toX":300,"toY":400,"reason":"why"}
{"action":"type","text":"text to type","id":3,"reason":"why"}
{"action":"clear","reason":"why"}
{"action":"key","key":"Enter","reason":"why"}
{"action":"scroll","direction":"down","pixels":300,"reason":"why"}
{"action":"back","reason":"why"}
{"action":"forward","reason":"why"}
{"action":"reload","reason":"why"}
{"action":"wait","ms":1000,"reason":"why"}
{"action":"save_screenshot","path":"/abs/or/relative/path.png","reason":"why"}
{"action":"done","summary":"what was accomplished"}
{"action":"failed","reason":"why you cannot complete the task"}

Tips:
- Prefer navigate over typing URLs into an address bar.
- Use clear before type if a field already has text.
- key supports: Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, etc.
- drag uses pixel coordinates (1280x800); all other targeting uses element id.
- scroll direction: up | down | left | right. Scroll if the element you need is not in the list yet.
- Keep reason under 10 words.`;
function buildUserMessage(task, history, pageUrl, marks) {
    const urlLine = pageUrl ? `\nCurrent URL: ${pageUrl}` : '';
    const historyText = history.length === 0
        ? 'No actions taken yet.'
        : history
            .map((h) => {
            const a = h.action;
            let desc;
            switch (a.action) {
                case 'navigate':
                    desc = `navigate(${a.url}) — ${a.reason}`;
                    break;
                case 'click':
                    desc = `click(#${a.id}) — ${a.reason}`;
                    break;
                case 'double_click':
                    desc = `double_click(#${a.id}) — ${a.reason}`;
                    break;
                case 'right_click':
                    desc = `right_click(#${a.id}) — ${a.reason}`;
                    break;
                case 'hover':
                    desc = `hover(#${a.id}) — ${a.reason}`;
                    break;
                case 'drag':
                    desc = `drag(${a.fromX},${a.fromY}→${a.toX},${a.toY}) — ${a.reason}`;
                    break;
                case 'type':
                    desc = `type("${a.text}"${a.id !== undefined ? `, #${a.id}` : ''}) — ${a.reason}`;
                    break;
                case 'clear':
                    desc = `clear — ${a.reason}`;
                    break;
                case 'scroll':
                    desc = `scroll(${a.direction},${a.pixels}px) — ${a.reason}`;
                    break;
                case 'key':
                    desc = `key(${a.key}) — ${a.reason}`;
                    break;
                case 'back':
                    desc = `back — ${a.reason}`;
                    break;
                case 'forward':
                    desc = `forward — ${a.reason}`;
                    break;
                case 'reload':
                    desc = `reload — ${a.reason}`;
                    break;
                case 'wait':
                    desc = `wait(${a.ms}ms) — ${a.reason}`;
                    break;
                case 'save_screenshot':
                    desc = `save_screenshot(${a.path}) — ${a.reason}`;
                    break;
                case 'done':
                    desc = `done: ${a.summary}`;
                    break;
                case 'failed':
                    desc = `failed: ${a.reason}`;
                    break;
            }
            const status = h.outcome === 'error' ? ` [ERROR: ${h.error}]` : '';
            const fb = h.feedback ? ` → ${h.feedback}` : '';
            return `  ${h.step}. ${desc}${status}${fb}`;
        })
            .join('\n');
    const elementsText = marks.length === 0
        ? 'No interactive elements detected. Try scroll, navigate, or wait.'
        : marks
            .map((m) => {
            const label = [m.role && `${m.role}`, m.name && `"${m.name}"`].filter(Boolean).join(' ');
            return `  [${m.id}] ${m.tag}${label ? ' ' + label : ''}`;
        })
            .join('\n');
    return `TASK: ${task}${urlLine}

Previous actions:
${historyText}

ELEMENTS (reference by id):
${elementsText}

Look at the screenshot and respond with the next action JSON.`;
}
function parseAction(raw) {
    let s = raw.trim();
    // Strip markdown fences
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try {
        const obj = JSON.parse(s);
        if (!obj.action)
            throw new Error('no action field');
        return obj;
    }
    catch {
        // Find first JSON object containing "action"
        const m = s.match(/\{[^{}]*"action"[^{}]*\}/);
        if (m) {
            const obj = JSON.parse(m[0]);
            if (obj.action)
                return obj;
        }
        throw new Error(`Cannot parse action from: ${raw.slice(0, 200)}`);
    }
}
function getActionReason(action) {
    if ('reason' in action)
        return action.reason;
    if ('summary' in action)
        return action.summary;
    return '';
}

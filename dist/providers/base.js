"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.buildUserMessage = buildUserMessage;
exports.parseAction = parseAction;
exports.getActionReason = getActionReason;
exports.SYSTEM_PROMPT = `You are a browser automation agent. Complete tasks by analyzing browser screenshots and deciding what action to take next.

Rules:
- Examine the screenshot carefully before deciding
- Pick the most logical next step toward completing the task
- Respond with ONLY a JSON object — no markdown, no explanation, no code fences
- Coordinates x and y are pixel positions in the screenshot

Available actions (respond with exactly one):
{"action":"navigate","url":"https://example.com","reason":"why"}
{"action":"click","x":450,"y":230,"reason":"why"}
{"action":"double_click","x":450,"y":230,"reason":"why"}
{"action":"right_click","x":450,"y":230,"reason":"why"}
{"action":"hover","x":450,"y":230,"reason":"why"}
{"action":"drag","fromX":100,"fromY":200,"toX":300,"toY":400,"reason":"why"}
{"action":"type","text":"text to type","reason":"why"}
{"action":"clear","reason":"why"}
{"action":"key","key":"Enter","reason":"why"}
{"action":"scroll","direction":"down","pixels":300,"reason":"why"}
{"action":"back","reason":"why"}
{"action":"forward","reason":"why"}
{"action":"reload","reason":"why"}
{"action":"wait","ms":1000,"reason":"why"}
{"action":"done","summary":"what was accomplished"}
{"action":"failed","reason":"why you cannot complete the task"}

Tips:
- Prefer navigate over typing URLs into an address bar.
- Use clear before type if a field already has text.
- key supports: Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, etc.
- scroll direction: up | down | left | right.
- Keep reason under 10 words.`;
function buildUserMessage(task, history, pageUrl) {
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
                    desc = `click(${a.x},${a.y}) — ${a.reason}`;
                    break;
                case 'double_click':
                    desc = `double_click(${a.x},${a.y}) — ${a.reason}`;
                    break;
                case 'right_click':
                    desc = `right_click(${a.x},${a.y}) — ${a.reason}`;
                    break;
                case 'hover':
                    desc = `hover(${a.x},${a.y}) — ${a.reason}`;
                    break;
                case 'drag':
                    desc = `drag(${a.fromX},${a.fromY}→${a.toX},${a.toY}) — ${a.reason}`;
                    break;
                case 'type':
                    desc = `type("${a.text}") — ${a.reason}`;
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
                case 'done':
                    desc = `done: ${a.summary}`;
                    break;
                case 'failed':
                    desc = `failed: ${a.reason}`;
                    break;
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

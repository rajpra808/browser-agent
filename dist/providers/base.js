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
{"action":"click","x":450,"y":230,"reason":"why you are clicking here"}
{"action":"type","text":"the text to type","reason":"why"}
{"action":"scroll","direction":"down","pixels":300,"reason":"why"}
{"action":"key","key":"Enter","reason":"why"}
{"action":"wait","ms":1000,"reason":"why"}
{"action":"done","summary":"what was accomplished"}
{"action":"failed","reason":"why you cannot complete the task"}`;
function buildUserMessage(task, history, pageUrl) {
    const urlLine = pageUrl ? `\nCurrent URL: ${pageUrl}` : '';
    const historyText = history.length === 0
        ? 'No actions taken yet.'
        : history
            .map((h) => {
            const a = h.action;
            let desc;
            switch (a.action) {
                case 'click':
                    desc = `click(${a.x},${a.y}) — ${a.reason}`;
                    break;
                case 'type':
                    desc = `type("${a.text}") — ${a.reason}`;
                    break;
                case 'scroll':
                    desc = `scroll(${a.direction},${a.pixels}px) — ${a.reason}`;
                    break;
                case 'key':
                    desc = `key(${a.key}) — ${a.reason}`;
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

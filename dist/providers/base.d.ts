import { Mark } from '../browser/marks';
export type BrowserAction = {
    action: 'navigate';
    url: string;
    reason: string;
} | {
    action: 'click';
    id: number;
    reason: string;
} | {
    action: 'double_click';
    id: number;
    reason: string;
} | {
    action: 'right_click';
    id: number;
    reason: string;
} | {
    action: 'hover';
    id: number;
    reason: string;
} | {
    action: 'drag';
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    reason: string;
} | {
    action: 'type';
    text: string;
    id?: number;
    reason: string;
} | {
    action: 'clear';
    reason: string;
} | {
    action: 'key';
    key: string;
    reason: string;
} | {
    action: 'scroll';
    direction: 'up' | 'down' | 'left' | 'right';
    pixels: number;
    reason: string;
} | {
    action: 'back';
    reason: string;
} | {
    action: 'forward';
    reason: string;
} | {
    action: 'reload';
    reason: string;
} | {
    action: 'wait';
    ms: number;
    reason: string;
} | {
    action: 'save_screenshot';
    path: string;
    reason: string;
} | {
    action: 'done';
    summary: string;
} | {
    action: 'failed';
    reason: string;
};
export interface ActionHistory {
    step: number;
    action: BrowserAction;
    outcome: 'success' | 'error';
    error?: string;
    feedback?: string;
}
export interface AIProvider {
    name: string;
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl: string | undefined, marks: Mark[]): Promise<BrowserAction>;
}
export declare const SYSTEM_PROMPT = "You are a browser automation agent. Complete tasks by analyzing browser screenshots and deciding the next action \u2014 like a human using a browser.\n\nThe screenshot is 1280x800. Every interactive element (links, buttons, inputs, etc.) is outlined with a colored box and a numbered label. To click, hover, or type into an element, reference it by its \"id\" number from the ELEMENTS list \u2014 NOT pixel coordinates. The id numbers match the labels drawn on the screenshot.\n\nRules:\n- Examine the screenshot AND the ELEMENTS list before deciding.\n- To fill a field: pick its id, then type into it. Passing \"id\" to type focuses that field first, so you don't need a separate click.\n- After acting, the next message tells you what changed (URL, focused element). Use that feedback \u2014 if nothing changed, your last action missed; pick a different element or strategy, do NOT repeat the same action.\n- Respond with ONLY a JSON object \u2014 no markdown, no explanation, no code fences.\n\nAvailable actions (respond with exactly one):\n{\"action\":\"navigate\",\"url\":\"https://example.com\",\"reason\":\"why\"}\n{\"action\":\"click\",\"id\":5,\"reason\":\"why\"}\n{\"action\":\"double_click\",\"id\":5,\"reason\":\"why\"}\n{\"action\":\"right_click\",\"id\":5,\"reason\":\"why\"}\n{\"action\":\"hover\",\"id\":5,\"reason\":\"why\"}\n{\"action\":\"drag\",\"fromX\":100,\"fromY\":200,\"toX\":300,\"toY\":400,\"reason\":\"why\"}\n{\"action\":\"type\",\"text\":\"text to type\",\"id\":3,\"reason\":\"why\"}\n{\"action\":\"clear\",\"reason\":\"why\"}\n{\"action\":\"key\",\"key\":\"Enter\",\"reason\":\"why\"}\n{\"action\":\"scroll\",\"direction\":\"down\",\"pixels\":300,\"reason\":\"why\"}\n{\"action\":\"back\",\"reason\":\"why\"}\n{\"action\":\"forward\",\"reason\":\"why\"}\n{\"action\":\"reload\",\"reason\":\"why\"}\n{\"action\":\"wait\",\"ms\":1000,\"reason\":\"why\"}\n{\"action\":\"save_screenshot\",\"path\":\"/abs/or/relative/path.png\",\"reason\":\"why\"}\n{\"action\":\"done\",\"summary\":\"what was accomplished\"}\n{\"action\":\"failed\",\"reason\":\"why you cannot complete the task\"}\n\nTips:\n- Prefer navigate over typing URLs into an address bar.\n- Use clear before type if a field already has text.\n- key supports: Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, etc.\n- drag uses pixel coordinates (1280x800); all other targeting uses element id.\n- scroll direction: up | down | left | right. Scroll if the element you need is not in the list yet.\n- Keep reason under 10 words.";
export declare function buildUserMessage(task: string, history: ActionHistory[], pageUrl: string | undefined, marks: Mark[]): string;
export declare function parseAction(raw: string): BrowserAction;
export declare function getActionReason(action: BrowserAction): string;
//# sourceMappingURL=base.d.ts.map
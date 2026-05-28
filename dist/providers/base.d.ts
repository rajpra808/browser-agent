export type BrowserAction = {
    action: 'navigate';
    url: string;
    reason: string;
} | {
    action: 'click';
    x: number;
    y: number;
    reason: string;
} | {
    action: 'double_click';
    x: number;
    y: number;
    reason: string;
} | {
    action: 'right_click';
    x: number;
    y: number;
    reason: string;
} | {
    action: 'hover';
    x: number;
    y: number;
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
}
export interface AIProvider {
    name: string;
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl?: string): Promise<BrowserAction>;
}
export declare const SYSTEM_PROMPT = "You are a browser automation agent. Complete tasks by analyzing browser screenshots and deciding what action to take next.\n\nRules:\n- Examine the screenshot carefully before deciding\n- Pick the most logical next step toward completing the task\n- Respond with ONLY a JSON object \u2014 no markdown, no explanation, no code fences\n- Coordinates x and y are pixel positions in the screenshot\n\nAvailable actions (respond with exactly one):\n{\"action\":\"navigate\",\"url\":\"https://example.com\",\"reason\":\"why\"}\n{\"action\":\"click\",\"x\":450,\"y\":230,\"reason\":\"why\"}\n{\"action\":\"double_click\",\"x\":450,\"y\":230,\"reason\":\"why\"}\n{\"action\":\"right_click\",\"x\":450,\"y\":230,\"reason\":\"why\"}\n{\"action\":\"hover\",\"x\":450,\"y\":230,\"reason\":\"why\"}\n{\"action\":\"drag\",\"fromX\":100,\"fromY\":200,\"toX\":300,\"toY\":400,\"reason\":\"why\"}\n{\"action\":\"type\",\"text\":\"text to type\",\"reason\":\"why\"}\n{\"action\":\"clear\",\"reason\":\"why\"}\n{\"action\":\"key\",\"key\":\"Enter\",\"reason\":\"why\"}\n{\"action\":\"scroll\",\"direction\":\"down\",\"pixels\":300,\"reason\":\"why\"}\n{\"action\":\"back\",\"reason\":\"why\"}\n{\"action\":\"forward\",\"reason\":\"why\"}\n{\"action\":\"reload\",\"reason\":\"why\"}\n{\"action\":\"wait\",\"ms\":1000,\"reason\":\"why\"}\n{\"action\":\"save_screenshot\",\"path\":\"/abs/or/relative/path.png\",\"reason\":\"why\"}\n{\"action\":\"done\",\"summary\":\"what was accomplished\"}\n{\"action\":\"failed\",\"reason\":\"why you cannot complete the task\"}\n\nTips:\n- Prefer navigate over typing URLs into an address bar.\n- Use clear before type if a field already has text.\n- key supports: Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, etc.\n- scroll direction: up | down | left | right.\n- Keep reason under 10 words.";
export declare function buildUserMessage(task: string, history: ActionHistory[], pageUrl?: string): string;
export declare function parseAction(raw: string): BrowserAction;
export declare function getActionReason(action: BrowserAction): string;
//# sourceMappingURL=base.d.ts.map
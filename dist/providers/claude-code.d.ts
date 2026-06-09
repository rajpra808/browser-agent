import { AIProvider, ActionHistory, BrowserAction } from './base';
import { Mark } from '../browser/marks';
import { ProviderConfig } from '../config';
export declare class ClaudeCodeProvider implements AIProvider {
    name: string;
    constructor(_config: ProviderConfig);
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl: string | undefined, marks: Mark[]): Promise<BrowserAction>;
}
//# sourceMappingURL=claude-code.d.ts.map
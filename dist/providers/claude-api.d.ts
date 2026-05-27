import { AIProvider, ActionHistory, BrowserAction } from './base';
import { ProviderConfig } from '../config';
export declare class ClaudeApiProvider implements AIProvider {
    name: string;
    private client;
    private model;
    constructor(config: ProviderConfig);
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl?: string): Promise<BrowserAction>;
}
//# sourceMappingURL=claude-api.d.ts.map
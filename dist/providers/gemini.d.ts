import { AIProvider, ActionHistory, BrowserAction } from './base';
import { ProviderConfig } from '../config';
export declare class GeminiProvider implements AIProvider {
    name: string;
    private apiKey;
    private model;
    constructor(config: ProviderConfig);
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl?: string): Promise<BrowserAction>;
}
//# sourceMappingURL=gemini.d.ts.map
import { AIProvider, ActionHistory, BrowserAction } from './base';
import { ProviderConfig } from '../config';
export declare class OllamaProvider implements AIProvider {
    name: string;
    private model;
    private baseUrl;
    constructor(config: ProviderConfig);
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl?: string): Promise<BrowserAction>;
}
//# sourceMappingURL=ollama.d.ts.map
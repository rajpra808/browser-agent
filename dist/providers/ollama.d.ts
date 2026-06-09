import { AIProvider, ActionHistory, BrowserAction } from './base';
import { Mark } from '../browser/marks';
import { ProviderConfig } from '../config';
export declare class OllamaProvider implements AIProvider {
    name: string;
    private model;
    private baseUrl;
    constructor(config: ProviderConfig);
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl: string | undefined, marks: Mark[]): Promise<BrowserAction>;
}
//# sourceMappingURL=ollama.d.ts.map
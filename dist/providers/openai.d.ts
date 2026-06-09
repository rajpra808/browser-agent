import { AIProvider, ActionHistory, BrowserAction } from './base';
import { Mark } from '../browser/marks';
import { ProviderConfig } from '../config';
export declare class OpenAIProvider implements AIProvider {
    name: string;
    private apiKey;
    private model;
    constructor(config: ProviderConfig);
    decideAction(task: string, screenshotB64: string, history: ActionHistory[], pageUrl: string | undefined, marks: Mark[]): Promise<BrowserAction>;
}
//# sourceMappingURL=openai.d.ts.map
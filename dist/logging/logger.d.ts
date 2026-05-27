import { BrowserAction } from '../providers/base';
export interface StepLogEntry {
    taskId: string;
    step: number;
    provider: string;
    action: BrowserAction;
    outcome: 'success' | 'error';
    error?: string;
    durationMs: number;
}
export declare function logStep(entry: StepLogEntry): void;
//# sourceMappingURL=logger.d.ts.map
export interface RunOptions {
    task: string;
    account?: string;
    provider?: string;
    model?: string;
    maxSteps?: number;
    headless?: boolean;
}
export interface RunResult {
    outcome: 'done' | 'failed' | 'max_steps';
    summary: string;
}
export declare function runTask(options: RunOptions): Promise<RunResult>;
//# sourceMappingURL=agent.d.ts.map
export interface RunOptions {
    task: string;
    account?: string;
    provider?: string;
    maxSteps?: number;
}
export interface RunResult {
    outcome: 'done' | 'failed' | 'max_steps';
    summary: string;
}
export declare function runTask(options: RunOptions): Promise<RunResult>;
//# sourceMappingURL=agent.d.ts.map
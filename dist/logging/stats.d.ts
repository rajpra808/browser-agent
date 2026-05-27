export interface TaskStats {
    taskId: string;
    task: string;
    account: string;
    provider: string;
    stepsTotal: number;
    outcome: 'done' | 'failed' | 'max_steps';
    startTime: Date;
    endTime: Date;
    summary: string;
}
export declare function logStats(stats: TaskStats): void;
//# sourceMappingURL=stats.d.ts.map
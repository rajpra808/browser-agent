import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';

const HEADER =
  'task_id,timestamp,task,account,provider,steps_total,outcome,start_time,end_time,duration_ms,summary\n';

function statsPath(): string {
  return path.resolve(getConfig().logging.dir, 'stats.csv');
}

function ensureFile(): void {
  const p = statsPath();
  if (!fs.existsSync(path.dirname(p))) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
  }
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, HEADER);
  }
}

function esc(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

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

export function logStats(stats: TaskStats): void {
  ensureFile();

  const durationMs = stats.endTime.getTime() - stats.startTime.getTime();

  const row =
    [
      stats.taskId,
      new Date().toISOString(),
      stats.task,
      stats.account,
      stats.provider,
      stats.stepsTotal,
      stats.outcome,
      stats.startTime.toISOString(),
      stats.endTime.toISOString(),
      durationMs,
      stats.summary,
    ]
      .map(esc)
      .join(',') + '\n';

  fs.appendFileSync(statsPath(), row);
}

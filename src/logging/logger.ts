import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
import { BrowserAction, getActionReason } from '../providers/base';

const HEADER =
  'timestamp,task_id,step,provider,action,details,reason,outcome,duration_ms\n';

function logPath(): string {
  return path.resolve(getConfig().logging.dir, 'logger.csv');
}

function ensureFile(): void {
  const p = logPath();
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

export interface StepLogEntry {
  taskId: string;
  step: number;
  provider: string;
  action: BrowserAction;
  outcome: 'success' | 'error';
  error?: string;
  durationMs: number;
}

function actionDetails(a: BrowserAction): string {
  const { action, ...rest } = a as { action: string; [k: string]: unknown };
  const { reason: _r, summary: _s, ...fields } = rest as Record<string, unknown>;
  return Object.keys(fields).length ? JSON.stringify(fields) : '';
}

export function logStep(entry: StepLogEntry): void {
  ensureFile();

  const a = entry.action;
  const outcomeStr = entry.error
    ? `${entry.outcome}: ${entry.error}`
    : entry.outcome;

  const row =
    [
      new Date().toISOString(),
      entry.taskId,
      entry.step,
      entry.provider,
      a.action,
      actionDetails(a),
      getActionReason(a),
      outcomeStr,
      entry.durationMs,
    ]
      .map(esc)
      .join(',') + '\n';

  fs.appendFileSync(logPath(), row);
}

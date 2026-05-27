"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStats = logStats;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const HEADER = 'task_id,timestamp,task,account,provider,steps_total,outcome,start_time,end_time,duration_ms,summary\n';
function statsPath() {
    return path_1.default.resolve((0, config_1.getConfig)().logging.dir, 'stats.csv');
}
function ensureFile() {
    const p = statsPath();
    if (!fs_1.default.existsSync(path_1.default.dirname(p))) {
        fs_1.default.mkdirSync(path_1.default.dirname(p), { recursive: true });
    }
    if (!fs_1.default.existsSync(p)) {
        fs_1.default.writeFileSync(p, HEADER);
    }
}
function esc(v) {
    if (v === undefined || v === null)
        return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
}
function logStats(stats) {
    ensureFile();
    const durationMs = stats.endTime.getTime() - stats.startTime.getTime();
    const row = [
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
    fs_1.default.appendFileSync(statsPath(), row);
}

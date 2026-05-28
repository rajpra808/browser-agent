"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStep = logStep;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const base_1 = require("../providers/base");
const HEADER = 'timestamp,task_id,step,provider,action,url,x,y,text,key,direction,pixels,ms,reason,outcome,duration_ms\n';
function logPath() {
    return path_1.default.resolve((0, config_1.getConfig)().logging.dir, 'logger.csv');
}
function ensureFile() {
    const p = logPath();
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
function logStep(entry) {
    ensureFile();
    const a = entry.action;
    const url = a.action === 'navigate' ? a.url : undefined;
    const x = a.action === 'click' ? a.x : undefined;
    const y = a.action === 'click' ? a.y : undefined;
    const text = a.action === 'type' ? a.text : undefined;
    const key = a.action === 'key' ? a.key : undefined;
    const dir = a.action === 'scroll' ? a.direction : undefined;
    const px = a.action === 'scroll' ? a.pixels : undefined;
    const ms = a.action === 'wait' ? a.ms : undefined;
    const outcomeStr = entry.error
        ? `${entry.outcome}: ${entry.error}`
        : entry.outcome;
    const row = [
        new Date().toISOString(),
        entry.taskId,
        entry.step,
        entry.provider,
        a.action,
        url, x, y, text, key, dir, px, ms,
        (0, base_1.getActionReason)(a),
        outcomeStr,
        entry.durationMs,
    ]
        .map(esc)
        .join(',') + '\n';
    fs_1.default.appendFileSync(logPath(), row);
}

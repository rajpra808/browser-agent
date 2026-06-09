"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeProvider = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
class ClaudeCodeProvider {
    name = 'claude-code';
    constructor(_config) { }
    async decideAction(task, screenshotB64, history, pageUrl, marks) {
        const userMessage = (0, base_1.buildUserMessage)(task, history, pageUrl, marks);
        const fullPrompt = `${base_1.SYSTEM_PROMPT}\n\n${userMessage}`;
        const tmpImg = path_1.default.join(os_1.default.tmpdir(), `browser-agent-${Date.now()}.png`);
        fs_1.default.writeFileSync(tmpImg, Buffer.from(screenshotB64, 'base64'));
        try {
            try {
                const { stdout } = await execFileAsync('claude', ['--print', fullPrompt, '--image', tmpImg], { timeout: 60_000 });
                return (0, base_1.parseAction)(stdout.trim());
            }
            catch {
                const textPrompt = `${base_1.SYSTEM_PROMPT}\n\n[A browser screenshot is attached but your CLI does not support images. ` +
                    `Reason on task completion based on the task and action history only.]\n\n${userMessage}`;
                const { stdout } = await execFileAsync('claude', ['--print', textPrompt], { timeout: 60_000 });
                return (0, base_1.parseAction)(stdout.trim());
            }
        }
        finally {
            try {
                fs_1.default.unlinkSync(tmpImg);
            }
            catch { }
        }
    }
}
exports.ClaudeCodeProvider = ClaudeCodeProvider;

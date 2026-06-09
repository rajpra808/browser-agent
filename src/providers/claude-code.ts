import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { Mark } from '../browser/marks';
import { ProviderConfig } from '../config';

const execFileAsync = promisify(execFile);

export class ClaudeCodeProvider implements AIProvider {
  name = 'claude-code';

  constructor(_config: ProviderConfig) {}

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl: string | undefined,
    marks: Mark[]
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl, marks);
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userMessage}`;

    const tmpImg = path.join(os.tmpdir(), `browser-agent-${Date.now()}.png`);
    fs.writeFileSync(tmpImg, Buffer.from(screenshotB64, 'base64'));

    try {
      try {
        const { stdout } = await execFileAsync(
          'claude',
          ['--print', fullPrompt, '--image', tmpImg],
          { timeout: 60_000 }
        );
        return parseAction(stdout.trim());
      } catch {
        const textPrompt =
          `${SYSTEM_PROMPT}\n\n[A browser screenshot is attached but your CLI does not support images. ` +
          `Reason on task completion based on the task and action history only.]\n\n${userMessage}`;
        const { stdout } = await execFileAsync(
          'claude',
          ['--print', textPrompt],
          { timeout: 60_000 }
        );
        return parseAction(stdout.trim());
      }
    } finally {
      try { fs.unlinkSync(tmpImg); } catch {}
    }
  }
}

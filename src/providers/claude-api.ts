import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { ProviderConfig } from '../config';

export class ClaudeApiProvider implements AIProvider {
  name = 'claude-api';
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'claude-sonnet-4-5';
  }

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl?: string
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshotB64 } },
            { type: 'text', text: userMessage },
          ],
        }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json() as { content: Array<{ type: string; text?: string }> };
    const text = data.content.find(c => c.type === 'text')?.text ?? '';
    return parseAction(text);
  }
}

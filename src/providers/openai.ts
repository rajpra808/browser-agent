import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { ProviderConfig } from '../config';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'gpt-4o-mini';
  }

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl?: string
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 512,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotB64}`, detail: 'high' } },
              { type: 'text', text: userMessage },
            ],
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const text = data.choices[0]?.message?.content ?? '';
    return parseAction(text);
  }
}

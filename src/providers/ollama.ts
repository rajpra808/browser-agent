import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { Mark } from '../browser/marks';
import { ProviderConfig } from '../config';

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  private model: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.model = config.model ?? 'llava:13b';
    this.baseUrl = (config.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
  }

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl: string | undefined,
    marks: Mark[]
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl, marks);

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: userMessage,
          images: [screenshotB64],
        },
      ],
      stream: false,
      options: { temperature: 0.1 },
    };

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { message: { content: string } };
    return parseAction(data.message.content);
  }
}

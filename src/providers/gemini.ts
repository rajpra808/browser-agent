import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { ProviderConfig } from '../config';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'gemini-2.0-flash';
  }

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl?: string
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/png', data: screenshotB64 } },
            { text: userMessage },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    const text = data.candidates[0]?.content?.parts[0]?.text ?? '';
    return parseAction(text);
  }
}

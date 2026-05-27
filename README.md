# browser-agent

Vision-based browser automation CLI. An LLM takes a screenshot, picks pixel coordinates to click or type, executes the action, repeats. No CSS selectors. Supports Claude, Gemini, OpenAI, Ollama (local/free), and Claude Code.

---

## Install

### Global (recommended — use anywhere)

```bash
npm install -g @rajpra808/browser-agent
```

Chromium is installed automatically. Sessions and logs are stored in `~/.browser-agent/`.

### Via npx (no install)

```bash
npx @rajpra808/browser-agent run "Go to google.com and search for cats"
```

### From source

```bash
git clone <repo>
cd browser-agent
npm install
npm run build
```

---

## Quick Start

```bash
# 1. Log in to an account (opens browser, you log in manually — one time only)
browser-agent login --account instagram_main

# 2. Run a task
browser-agent run "Go to instagram.com and like the first post" \
  --account instagram_main \
  --provider claude-api
```

**With API key:**

```bash
ANTHROPIC_API_KEY=sk-ant-... browser-agent run "search for cats on google"
```

**Using npx:**

```bash
ANTHROPIC_API_KEY=sk-ant-... npx @rajpra808/browser-agent run "search for cats on google"
```

---

## Commands

### `run` — Execute a task with AI

```
node dist/cli.js run <task> [options]

Arguments:
  task                  Natural language task description (required)

Options:
  -a, --account <name>  Named session account  (default: "default")
  -p, --provider <name> AI provider to use      (default: from config)
  -s, --max-steps <n>   Max steps before giving up (default: 30)
```

**Examples:**

```bash
# Search on Google
node dist/cli.js run "Go to google.com and search for TypeScript tutorials" --account default

# Social media action
node dist/cli.js run "Open Twitter, find the first tweet about AI, and like it" \
  --account twitter_work \
  --provider gemini

# Use Ollama (free, local)
node dist/cli.js run "Open Hacker News and upvote the top story" \
  --provider ollama \
  --max-steps 10

# Override provider via env
BROWSER_AGENT_PROVIDER=openai node dist/cli.js run "Fill out the contact form"
```

### `login` — Manual login (no AI)

Opens a persistent browser session so you can log in to a site. The session (cookies, localStorage) is saved automatically.

```
node dist/cli.js login [options]

Options:
  -a, --account <name>  Named session account  (default: "default")
```

**Example:**

```bash
node dist/cli.js login --account twitter_work
# Browser opens → log in → press Enter in terminal → session saved to sessions/twitter_work/
```

Use a different account name per site / persona:

```bash
node dist/cli.js login --account instagram_main
node dist/cli.js login --account instagram_alt
node dist/cli.js login --account linkedin_recruiter
```

---

## Configuration

File: `browser-agent.config.json` in the project root (or `~/.browser-agent/config.json`).

```json
{
  "provider": "claude-api",
  "providers": {
    "claude-api": {
      "model": "claude-sonnet-4-5",
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "gemini": {
      "model": "gemini-2.0-flash",
      "apiKey": "${GEMINI_API_KEY}"
    },
    "openai": {
      "model": "gpt-4o-mini",
      "apiKey": "${OPENAI_API_KEY}"
    },
    "ollama": {
      "model": "llava:13b",
      "baseUrl": "http://localhost:11434"
    },
    "claude-code": {}
  },
  "browser": {
    "headless": false,
    "sessionDir": "./sessions",
    "defaultAccount": "default",
    "viewport": { "width": 1280, "height": 800 }
  },
  "agent": {
    "maxSteps": 30,
    "stepDelayMs": 500
  },
  "logging": {
    "dir": "./logs"
  }
}
```

`${VAR}` syntax in config values is replaced from environment variables at startup.

---

## Provider Setup

### Claude API

```bash
export ANTHROPIC_API_KEY=sk-ant-...
node dist/cli.js run "task" --provider claude-api
```

Model default: `claude-sonnet-4-5`. All Claude 3.x+ models support vision.

### Gemini

```bash
export GEMINI_API_KEY=AIza...
node dist/cli.js run "task" --provider gemini
```

Model default: `gemini-2.0-flash`.

### OpenAI

```bash
export OPENAI_API_KEY=sk-...
node dist/cli.js run "task" --provider openai
```

Model default: `gpt-4o-mini`. Use `gpt-4o` for better accuracy.

### Ollama (local, free)

```bash
# Pull a vision model first
ollama pull llava:13b   # or: llava:7b, qwen2-vl:7b, minicpm-v

node dist/cli.js run "task" --provider ollama
```

Default baseUrl: `http://localhost:11434`. Change in config if Ollama runs elsewhere.

### Claude Code (subprocess)

Uses the installed `claude` CLI via subprocess. No API key needed — uses your Claude subscription.

```bash
node dist/cli.js run "task" --provider claude-code
```

Requires `claude` to be installed and authenticated (`claude auth login`).

---

## Session Management

Each `--account` gets its own Playwright browser profile directory under `sessions/`.

```
sessions/
├── default/          # Default account
├── instagram_main/   # Saved Instagram login
├── twitter_work/     # Saved Twitter login
└── linkedin_main/    # Saved LinkedIn login
```

Sessions persist cookies, localStorage, and IndexedDB. Log in once, reuse indefinitely.

**Clearing a session:**

```bash
rm -rf sessions/instagram_main/
```

---

## Logs

After every run, two CSV files are updated in `logs/`:

### `logs/logger.csv` — Per-step log

| Column | Description |
|---|---|
| `timestamp` | ISO timestamp of the step |
| `task_id` | Unique ID for the task run |
| `step` | Step number (1-based) |
| `provider` | LLM provider used |
| `action` | Action type: click/type/scroll/key/wait/done/failed |
| `x`, `y` | Click coordinates (click action only) |
| `text` | Text typed (type action only) |
| `key` | Key pressed (key action only) |
| `direction` | Scroll direction (scroll action only) |
| `pixels` | Scroll distance (scroll action only) |
| `ms` | Wait duration (wait action only) |
| `reason` | LLM's explanation for the action |
| `outcome` | `success` or `error: <message>` |
| `duration_ms` | Total step time (LLM + execution) |

### `logs/stats.csv` — Per-task summary

| Column | Description |
|---|---|
| `task_id` | Unique ID for the task run |
| `timestamp` | When the task completed |
| `task` | Full task description |
| `account` | Account name used |
| `provider` | LLM provider used |
| `steps_total` | Number of steps taken |
| `outcome` | `done` / `failed` / `max_steps` |
| `start_time` | Task start timestamp |
| `end_time` | Task end timestamp |
| `duration_ms` | Total task duration |
| `summary` | LLM's final summary or failure reason |

---

## How It Works

1. **Screenshot** — Takes a viewport screenshot of the current browser page
2. **LLM decision** — Sends screenshot + task + action history to the LLM
3. **Parse action** — LLM returns a JSON action: `click`, `type`, `scroll`, `key`, `wait`, `done`, or `failed`
4. **Execute** — Playwright executes the action at the specified coordinates
5. **Log** — Step is written to `logger.csv`
6. **Repeat** — Until `done`, `failed`, or `maxSteps` reached
7. **Stats** — Task summary written to `stats.csv`

The LLM prompt instructs the model to return **only** a JSON object with no markdown wrapping.

---

## Development

```bash
npm run build       # Compile TypeScript
npm run dev         # Run CLI via tsx (no build needed)
npm test            # Run all tests
npm run test:watch  # Watch mode
```

### Adding a New Provider

1. Create `src/providers/yourprovider.ts` implementing `AIProvider`:

```typescript
import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { ProviderConfig } from '../config';

export class YourProvider implements AIProvider {
  name = 'yourprovider';

  constructor(config: ProviderConfig) { /* init SDK */ }

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl?: string
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl);
    // call your SDK with SYSTEM_PROMPT + userMessage + screenshotB64 image
    const raw = /* response text */;
    return parseAction(raw);
  }
}
```

2. Register in `src/providers/index.ts`:

```typescript
case 'yourprovider': return new YourProvider(config);
```

3. Add to `browser-agent.config.json` under `providers`.

---

## Troubleshooting

**Browser doesn't open:** Set `"headless": false` in config (default). Check that Playwright Chromium is installed: `npx playwright install chromium`.

**LLM returns invalid JSON:** Enable verbose logging by watching `logger.csv`. The `reason` column shows what the LLM said. Some models need stricter prompting — try a larger model or `claude-api`.

**Session not persisting:** Run `login` command first for the account. Check that `sessions/<account>/` directory exists and has content.

**Ollama vision not working:** Ensure you pulled a vision-capable model (`llava`, `qwen2-vl`, `minicpm-v`). Text-only models like `llama3` will not work.

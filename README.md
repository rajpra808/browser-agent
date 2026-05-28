# browser-agent

Vision-based browser automation CLI. An LLM takes a screenshot, picks pixel coordinates to click or type, executes the action, repeats. No CSS selectors. Supports Claude, Gemini, OpenAI, Ollama (local/free), and Claude Code.

Zero heavy SDK dependencies — all API calls use native `fetch`.

---

## Install

```bash
npm install -g @rajpra808/browser-agent
npx playwright install chromium
```

Sessions and logs are stored in `~/.browser-agent/`.

If `browser-agent` is not on your PATH after install:
```bash
export PATH="$(npm prefix -g)/bin:$PATH"
# Persist by adding the line above to ~/.zshrc or ~/.bashrc
```

### From source

```bash
git clone https://github.com/rajpra808/browser-agent
cd browser-agent
npm install
npm run build
```

---

## Quick Start

```bash
# 1. Set API key for your provider
export ANTHROPIC_API_KEY=sk-ant-...   # Claude
export GEMINI_API_KEY=AIza...         # Gemini
export OPENAI_API_KEY=sk-...          # OpenAI
# Ollama needs no key — runs locally

# 2. Run a task
browser-agent run "Go to google.com and search for cats" --provider claude-api

# 3. Login to a site (one time per account, saves cookies/session)
browser-agent login --account instagram_main
# Browser opens → log in → press Enter → session saved

# 4. Use that session
browser-agent run "Like the first post on instagram.com" \
  --account instagram_main \
  --provider claude-api
```

---

## Commands

### `run` — Execute a task with AI

```
browser-agent run <task> [options]

Arguments:
  task                    Natural language task description (required)

Options:
  -a, --account <name>    Named session account           (default: "default")
  -p, --provider <name>   AI provider to use              (default: from config)
  -m, --model <model>     Model override                  (default: from config)
  -s, --max-steps <n>     Max steps before giving up      (default: 30)
```

**Examples:**

```bash
# Basic
browser-agent run "Go to google.com and search for TypeScript tutorials"

# Pick provider
browser-agent run "Search for cats" --provider gemini

# Pick provider + model
browser-agent run "Search for cats" --provider claude-api --model claude-opus-4-7
browser-agent run "Search for cats" --provider gemini --model gemini-1.5-pro
browser-agent run "Search for cats" --provider openai --model gpt-4o
browser-agent run "Search for cats" --provider ollama --model llava:7b

# With saved session
browser-agent run "Like the first tweet about AI" \
  --account twitter_work \
  --provider claude-api

# Override provider via env
BROWSER_AGENT_PROVIDER=openai browser-agent run "Fill out the contact form"
```

---

### `login` — Manual login (no AI)

Opens a persistent browser session so you can log in to a site. Session (cookies, localStorage) saved on exit.

```
browser-agent login [options]

Options:
  -a, --account <name>    Named session account  (default: "default")
```

**Example:**

```bash
browser-agent login --account twitter_work
# Browser opens → log in → press Enter in terminal → session saved

# Use separate accounts per site / persona
browser-agent login --account instagram_main
browser-agent login --account instagram_alt
browser-agent login --account linkedin_recruiter
```

---

### `models` — List available models

```
browser-agent models [provider]

Arguments:
  provider    Optional: claude-api | gemini | openai | ollama | claude-code

Options:
  -u, --base-url <url>    Ollama base URL  (default: "http://localhost:11434")
```

**Examples:**

```bash
# List all providers and their models
browser-agent models

# List models for one provider
browser-agent models claude-api
browser-agent models gemini
browser-agent models ollama   # queries local Ollama for installed models
```

**Output:**
```
claude-api  (default: claude-sonnet-4-5)
  claude-opus-4-7
  claude-sonnet-4-6
  claude-haiku-4-5-20251001
  claude-sonnet-4-5
  claude-opus-4-5

gemini  (default: gemini-2.0-flash)
  gemini-2.0-flash
  gemini-2.0-flash-lite
  gemini-1.5-pro
  gemini-1.5-flash
...
```

---

## Configuration

Optional config file: `browser-agent.config.json` in the working directory, or `~/.browser-agent/config.json`.

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

`${VAR}` in config values is replaced from environment variables at startup.

---

## Provider Setup

### Claude API

```bash
export ANTHROPIC_API_KEY=sk-ant-...
browser-agent run "task" --provider claude-api
browser-agent run "task" --provider claude-api --model claude-opus-4-7
```

Default model: `claude-sonnet-4-5`. See all: `browser-agent models claude-api`.

### Gemini

```bash
export GEMINI_API_KEY=AIza...
browser-agent run "task" --provider gemini
browser-agent run "task" --provider gemini --model gemini-1.5-pro
```

Default model: `gemini-2.0-flash`. See all: `browser-agent models gemini`.

### OpenAI

```bash
export OPENAI_API_KEY=sk-...
browser-agent run "task" --provider openai
browser-agent run "task" --provider openai --model gpt-4o
```

Default model: `gpt-4o-mini`. See all: `browser-agent models openai`.

### Ollama (local, free)

```bash
# Pull a vision model first
ollama pull llava:13b   # or: llava:7b, qwen2-vl:7b, minicpm-v

browser-agent run "task" --provider ollama
browser-agent run "task" --provider ollama --model llava:7b

# List what you have installed
browser-agent models ollama
```

Default baseUrl: `http://localhost:11434`.

### Claude Code (subprocess)

Uses the `claude` CLI. No API key needed — uses your Claude subscription.

```bash
browser-agent run "task" --provider claude-code
```

Requires `claude` CLI installed and authenticated (`claude auth login`).

---

## Session Management

Each `--account` gets its own Playwright browser profile under `~/.browser-agent/sessions/`.

```
~/.browser-agent/sessions/
├── default/
├── instagram_main/
├── twitter_work/
└── linkedin_recruiter/
```

Sessions persist cookies, localStorage, and IndexedDB. Log in once, reuse indefinitely.

```bash
# Clear a session
rm -rf ~/.browser-agent/sessions/instagram_main/
```

---

## Logs

After every run, two CSV files are updated in `~/.browser-agent/logs/`.

### `logger.csv` — Per-step log

| Column | Description |
|---|---|
| `timestamp` | ISO timestamp |
| `task_id` | Unique run ID |
| `step` | Step number |
| `provider` | Provider used |
| `action` | click / type / scroll / key / wait / done / failed |
| `x`, `y` | Click coordinates |
| `text` | Text typed |
| `key` | Key pressed |
| `direction` | Scroll direction |
| `pixels` | Scroll distance |
| `ms` | Wait duration |
| `reason` | LLM's reasoning |
| `outcome` | `success` or `error: <msg>` |
| `duration_ms` | Step time (LLM + execution) |

### `stats.csv` — Per-task summary

| Column | Description |
|---|---|
| `task_id` | Unique run ID |
| `timestamp` | Completion time |
| `task` | Task description |
| `account` | Account used |
| `provider` | Provider used |
| `steps_total` | Steps taken |
| `outcome` | `done` / `failed` / `max_steps` |
| `duration_ms` | Total duration |
| `summary` | LLM's final summary or failure reason |

---

## How It Works

1. **Screenshot** — Takes a viewport screenshot of the current page
2. **LLM decision** — Sends screenshot + task + action history to the LLM via REST API
3. **Parse action** — LLM returns a JSON action: `click`, `type`, `scroll`, `key`, `wait`, `done`, or `failed`
4. **Execute** — Playwright executes the action at the specified coordinates
5. **Log** — Step written to `logger.csv`
6. **Repeat** — Until `done`, `failed`, or `maxSteps` reached
7. **Stats** — Task summary written to `stats.csv`

---

## Development

```bash
npm run build       # Compile TypeScript
npm run dev         # Run via tsx (no build needed)
npm test            # Run all tests
npm run test:watch  # Watch mode
```

### Adding a New Provider

1. Create `src/providers/yourprovider.ts`:

```typescript
import { AIProvider, ActionHistory, BrowserAction, SYSTEM_PROMPT, buildUserMessage, parseAction } from './base';
import { ProviderConfig } from '../config';

export class YourProvider implements AIProvider {
  name = 'yourprovider';

  constructor(config: ProviderConfig) {}

  async decideAction(
    task: string,
    screenshotB64: string,
    history: ActionHistory[],
    pageUrl?: string
  ): Promise<BrowserAction> {
    const userMessage = buildUserMessage(task, history, pageUrl);
    const res = await fetch('https://your-api.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ /* ... */ }),
    });
    const data = await res.json();
    return parseAction(data.text);
  }
}
```

2. Register in `src/providers/index.ts`:

```typescript
case 'yourprovider': return new YourProvider(config);
```

3. Add model list to `PROVIDER_MODELS` in `src/providers/index.ts`.

---

## Troubleshooting

**`browser-agent: command not found`** — Add npm global bin to PATH:
```bash
export PATH="$PATH:$(npm bin -g)"
echo 'export PATH="$PATH:$(npm bin -g)"' >> ~/.zshrc
```

**Browser doesn't open** — Chromium may need manual install:
```bash
npx playwright install chromium
```

**LLM returns invalid JSON** — Check `logger.csv` for what the model said. Try a larger model (`--model claude-opus-4-7` or `--model gpt-4o`).

**Session not persisting** — Run `browser-agent login --account <name>` first. Check `~/.browser-agent/sessions/<name>/` exists.

**Ollama vision not working** — Pull a vision-capable model. Text-only models (`llama3`, etc.) won't work:
```bash
ollama pull llava:13b
browser-agent models ollama   # confirm it's listed
```

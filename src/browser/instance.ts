import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';

const contexts = new Map<string, BrowserContext>();

function isMissingChromium(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("Executable doesn't exist") || msg.includes('playwright install');
}

export async function getBrowserContext(account: string): Promise<BrowserContext> {
  const existing = contexts.get(account);
  if (existing) return existing;

  const config = getConfig();
  const sessionDir = path.resolve(config.browser.sessionDir, account);

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  let context: BrowserContext;
  try {
    context = await chromium.launchPersistentContext(sessionDir, {
      headless: config.browser.headless,
      viewport: config.browser.viewport,
      args: ['--no-sandbox'],
    });
  } catch (err) {
    if (isMissingChromium(err)) {
      throw new Error(
        'Chromium browser not installed. Run:\n\n  npx playwright install chromium\n'
      );
    }
    throw err;
  }

  contexts.set(account, context);
  return context;
}

export async function getActivePage(account: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await getBrowserContext(account);
  const pages = context.pages();

  // Reuse last open non-closed page, or open a new one
  let page: Page | undefined;
  for (let i = pages.length - 1; i >= 0; i--) {
    if (!pages[i].isClosed()) {
      page = pages[i];
      break;
    }
  }

  if (!page) {
    page = await context.newPage();
  }

  return { context, page };
}

export async function closeBrowserContext(account: string): Promise<void> {
  const ctx = contexts.get(account);
  if (ctx) {
    await ctx.close();
    contexts.delete(account);
  }
}

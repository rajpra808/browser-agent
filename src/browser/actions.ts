import { Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function saveScreenshot(page: Page, target: string): Promise<string> {
  let resolved = target.startsWith('~') ? path.join(os.homedir(), target.slice(1)) : target;
  resolved = path.resolve(resolved);

  let stat: fs.Stats | null = null;
  try { stat = fs.statSync(resolved); } catch {}
  if (stat?.isDirectory() || /[\\/]$/.test(target) || !path.extname(resolved)) {
    const fname = `browser-agent-${Date.now()}.png`;
    resolved = path.join(resolved, fname);
  }

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  await page.screenshot({ path: resolved, type: 'png', fullPage: true });
  return resolved;
}

export async function screenshot(page: Page): Promise<string> {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  try {
    const buf = await page.screenshot({ type: 'png', fullPage: false });
    return buf.toString('base64');
  } catch (err) {
    await new Promise<void>((r) => setTimeout(r, 500));
    const buf = await page.screenshot({ type: 'png', fullPage: false });
    return buf.toString('base64');
  }
}

export async function click(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.click(x, y);
}

export async function doubleClick(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.dblclick(x, y);
}

export async function rightClick(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.click(x, y, { button: 'right' });
}

export async function hover(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
}

export async function drag(page: Page, fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(toX, toY, { steps: 10 });
  await page.mouse.up();
}

export async function typeText(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

export async function clearField(page: Page): Promise<void> {
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+A`);
  await page.keyboard.press('Delete');
}

export async function scroll(
  page: Page,
  direction: 'up' | 'down' | 'left' | 'right',
  pixels: number
): Promise<void> {
  let dx = 0, dy = 0;
  if (direction === 'down')  dy = pixels;
  if (direction === 'up')    dy = -pixels;
  if (direction === 'right') dx = pixels;
  if (direction === 'left')  dx = -pixels;
  await page.mouse.wheel(dx, dy);
}

export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

export async function navigate(page: Page, url: string): Promise<void> {
  const target = /^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('about:')
    ? url
    : `https://${url}`;
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
}

export async function goBack(page: Page): Promise<void> {
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
}

export async function goForward(page: Page): Promise<void> {
  await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
}

export async function reload(page: Page): Promise<void> {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
}

export async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

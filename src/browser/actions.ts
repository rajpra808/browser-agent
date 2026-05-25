import { Page } from 'playwright';

export async function screenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: 'png', fullPage: false });
  return buf.toString('base64');
}

export async function click(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.click(x, y);
}

export async function typeText(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

export async function scroll(page: Page, direction: 'up' | 'down', pixels: number): Promise<void> {
  const deltaY = direction === 'down' ? pixels : -pixels;
  await page.mouse.wheel(0, deltaY);
}

export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

export async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

import { Page } from 'playwright';

export interface Mark {
  id: number;
  tag: string;
  role: string;
  name: string;
}

const OVERLAY_ID = '__som_overlay__';

export async function annotatePage(page: Page): Promise<Mark[]> {
  return page.evaluate((overlayId) => {
    const SELECTOR = [
      'a', 'button', 'input', 'textarea', 'select',
      '[role=button]', '[role=link]', '[role=textbox]', '[role=searchbox]',
      '[role=combobox]', '[role=menuitem]', '[role=tab]', '[role=checkbox]',
      '[contenteditable=""]', '[contenteditable=true]',
      '[onclick]', '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    document.getElementById(overlayId)?.remove();
    document.querySelectorAll('[data-som-id]').forEach((el) => el.removeAttribute('data-som-id'));

    const layer = document.createElement('div');
    layer.id = overlayId;
    layer.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
    document.body.appendChild(layer);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const palette = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080', '#9a6324'];
    const marks: Array<{ id: number; tag: string; role: string; name: string }> = [];
    let id = 0;

    const candidates = Array.from(document.querySelectorAll(SELECTOR)) as HTMLElement[];
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
      if ((el as HTMLInputElement).disabled) continue;

      el.setAttribute('data-som-id', String(id));

      const name = (
        el.getAttribute('aria-label') ||
        (el as HTMLInputElement).placeholder ||
        (el as HTMLInputElement).value ||
        el.getAttribute('name') ||
        el.getAttribute('title') ||
        el.getAttribute('alt') ||
        (el.textContent || '').trim()
      ).replace(/\s+/g, ' ').trim().slice(0, 40);

      const color = palette[id % palette.length];
      const box = document.createElement('div');
      box.style.cssText =
        `position:fixed;left:${rect.left}px;top:${rect.top}px;` +
        `width:${rect.width}px;height:${rect.height}px;` +
        `border:2px solid ${color};box-sizing:border-box;`;
      const tag = document.createElement('div');
      tag.textContent = String(id);
      tag.style.cssText =
        `position:fixed;left:${rect.left}px;top:${Math.max(0, rect.top - 14)}px;` +
        `background:${color};color:#fff;font:bold 11px monospace;` +
        `padding:0 3px;line-height:14px;z-index:2147483647;`;
      layer.appendChild(box);
      layer.appendChild(tag);

      marks.push({
        id,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        name,
      });
      id++;
    }

    return marks;
  }, OVERLAY_ID);
}

export async function clearMarks(page: Page): Promise<void> {
  await page
    .evaluate((overlayId) => {
      document.getElementById(overlayId)?.remove();
    }, OVERLAY_ID)
    .catch(() => {});
}

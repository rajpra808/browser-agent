"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenshot = screenshot;
exports.click = click;
exports.typeText = typeText;
exports.scroll = scroll;
exports.pressKey = pressKey;
exports.navigate = navigate;
exports.wait = wait;
async function screenshot(page) {
    await page.waitForLoadState('domcontentloaded').catch(() => { });
    try {
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        return buf.toString('base64');
    }
    catch (err) {
        await new Promise((r) => setTimeout(r, 500));
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        return buf.toString('base64');
    }
}
async function click(page, x, y) {
    await page.mouse.click(x, y);
}
async function typeText(page, text) {
    await page.keyboard.type(text, { delay: 50 });
}
async function scroll(page, direction, pixels) {
    const deltaY = direction === 'down' ? pixels : -pixels;
    await page.mouse.wheel(0, deltaY);
}
async function pressKey(page, key) {
    await page.keyboard.press(key);
}
async function navigate(page, url) {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
}
async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

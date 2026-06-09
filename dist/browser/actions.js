"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveScreenshot = saveScreenshot;
exports.screenshot = screenshot;
exports.clickElement = clickElement;
exports.doubleClickElement = doubleClickElement;
exports.rightClickElement = rightClickElement;
exports.hoverElement = hoverElement;
exports.focusElement = focusElement;
exports.drag = drag;
exports.typeText = typeText;
exports.clearField = clearField;
exports.scroll = scroll;
exports.pressKey = pressKey;
exports.navigate = navigate;
exports.goBack = goBack;
exports.goForward = goForward;
exports.reload = reload;
exports.wait = wait;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
async function saveScreenshot(page, target) {
    let resolved = target.startsWith('~') ? path_1.default.join(os_1.default.homedir(), target.slice(1)) : target;
    resolved = path_1.default.resolve(resolved);
    let stat = null;
    try {
        stat = fs_1.default.statSync(resolved);
    }
    catch { }
    if (stat?.isDirectory() || /[\\/]$/.test(target) || !path_1.default.extname(resolved)) {
        const fname = `browser-agent-${Date.now()}.png`;
        resolved = path_1.default.join(resolved, fname);
    }
    fs_1.default.mkdirSync(path_1.default.dirname(resolved), { recursive: true });
    await page.screenshot({ path: resolved, type: 'png', fullPage: true });
    return resolved;
}
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
function markLocator(page, id) {
    return page.locator(`[data-som-id="${id}"]`);
}
async function clickElement(page, id) {
    await markLocator(page, id).click({ timeout: 5_000 });
}
async function doubleClickElement(page, id) {
    await markLocator(page, id).dblclick({ timeout: 5_000 });
}
async function rightClickElement(page, id) {
    await markLocator(page, id).click({ button: 'right', timeout: 5_000 });
}
async function hoverElement(page, id) {
    await markLocator(page, id).hover({ timeout: 5_000 });
}
async function focusElement(page, id) {
    await markLocator(page, id).click({ timeout: 5_000 });
}
async function drag(page, fromX, fromY, toX, toY) {
    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    await page.mouse.move(toX, toY, { steps: 10 });
    await page.mouse.up();
}
async function typeText(page, text, id) {
    if (id !== undefined)
        await focusElement(page, id);
    await page.keyboard.type(text, { delay: 50 });
}
async function clearField(page) {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press('Delete');
}
async function scroll(page, direction, pixels) {
    let dx = 0, dy = 0;
    if (direction === 'down')
        dy = pixels;
    if (direction === 'up')
        dy = -pixels;
    if (direction === 'right')
        dx = pixels;
    if (direction === 'left')
        dx = -pixels;
    await page.mouse.wheel(dx, dy);
}
async function pressKey(page, key) {
    await page.keyboard.press(key);
}
async function navigate(page, url) {
    const target = /^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('about:')
        ? url
        : `https://${url}`;
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
}
async function goBack(page) {
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => { });
}
async function goForward(page) {
    await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => { });
}
async function reload(page) {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => { });
}
async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

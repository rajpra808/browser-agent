import { Page } from 'playwright';
export declare function saveScreenshot(page: Page, target: string): Promise<string>;
export declare function screenshot(page: Page): Promise<string>;
export declare function clickElement(page: Page, id: number): Promise<void>;
export declare function doubleClickElement(page: Page, id: number): Promise<void>;
export declare function rightClickElement(page: Page, id: number): Promise<void>;
export declare function hoverElement(page: Page, id: number): Promise<void>;
export declare function focusElement(page: Page, id: number): Promise<void>;
export declare function drag(page: Page, fromX: number, fromY: number, toX: number, toY: number): Promise<void>;
export declare function typeText(page: Page, text: string, id?: number): Promise<void>;
export declare function clearField(page: Page): Promise<void>;
export declare function scroll(page: Page, direction: 'up' | 'down' | 'left' | 'right', pixels: number): Promise<void>;
export declare function pressKey(page: Page, key: string): Promise<void>;
export declare function navigate(page: Page, url: string): Promise<void>;
export declare function goBack(page: Page): Promise<void>;
export declare function goForward(page: Page): Promise<void>;
export declare function reload(page: Page): Promise<void>;
export declare function wait(ms: number): Promise<void>;
//# sourceMappingURL=actions.d.ts.map
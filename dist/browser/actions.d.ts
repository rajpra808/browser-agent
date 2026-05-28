import { Page } from 'playwright';
export declare function screenshot(page: Page): Promise<string>;
export declare function click(page: Page, x: number, y: number): Promise<void>;
export declare function doubleClick(page: Page, x: number, y: number): Promise<void>;
export declare function rightClick(page: Page, x: number, y: number): Promise<void>;
export declare function hover(page: Page, x: number, y: number): Promise<void>;
export declare function drag(page: Page, fromX: number, fromY: number, toX: number, toY: number): Promise<void>;
export declare function typeText(page: Page, text: string): Promise<void>;
export declare function clearField(page: Page): Promise<void>;
export declare function scroll(page: Page, direction: 'up' | 'down' | 'left' | 'right', pixels: number): Promise<void>;
export declare function pressKey(page: Page, key: string): Promise<void>;
export declare function navigate(page: Page, url: string): Promise<void>;
export declare function goBack(page: Page): Promise<void>;
export declare function goForward(page: Page): Promise<void>;
export declare function reload(page: Page): Promise<void>;
export declare function wait(ms: number): Promise<void>;
//# sourceMappingURL=actions.d.ts.map
import { Page } from 'playwright';
export declare function screenshot(page: Page): Promise<string>;
export declare function click(page: Page, x: number, y: number): Promise<void>;
export declare function typeText(page: Page, text: string): Promise<void>;
export declare function scroll(page: Page, direction: 'up' | 'down', pixels: number): Promise<void>;
export declare function pressKey(page: Page, key: string): Promise<void>;
export declare function wait(ms: number): Promise<void>;
//# sourceMappingURL=actions.d.ts.map
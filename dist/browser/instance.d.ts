import { BrowserContext, Page } from 'playwright';
export declare function getBrowserContext(account: string): Promise<BrowserContext>;
export declare function getActivePage(account: string): Promise<{
    context: BrowserContext;
    page: Page;
}>;
export declare function closeBrowserContext(account: string): Promise<void>;
//# sourceMappingURL=instance.d.ts.map
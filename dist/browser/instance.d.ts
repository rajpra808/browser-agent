import { BrowserContext, Page } from 'playwright';
export interface LaunchOverrides {
    headless?: boolean;
}
export declare function getBrowserContext(account: string, overrides?: LaunchOverrides): Promise<BrowserContext>;
export declare function getActivePage(account: string, overrides?: LaunchOverrides): Promise<{
    context: BrowserContext;
    page: Page;
}>;
export declare function closeBrowserContext(account: string): Promise<void>;
//# sourceMappingURL=instance.d.ts.map
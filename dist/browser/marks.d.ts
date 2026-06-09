import { Page } from 'playwright';
export interface Mark {
    id: number;
    tag: string;
    role: string;
    name: string;
}
export declare function annotatePage(page: Page): Promise<Mark[]>;
export declare function clearMarks(page: Page): Promise<void>;
//# sourceMappingURL=marks.d.ts.map
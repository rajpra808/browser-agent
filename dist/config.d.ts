export interface ProviderConfig {
    model?: string;
    apiKey?: string;
    baseUrl?: string;
}
export interface Config {
    provider: string;
    providers: Record<string, ProviderConfig>;
    browser: {
        headless: boolean;
        sessionDir: string;
        defaultAccount: string;
        viewport: {
            width: number;
            height: number;
        };
    };
    agent: {
        maxSteps: number;
        stepDelayMs: number;
    };
    logging: {
        dir: string;
    };
}
export declare function _resolveEnvVars(obj: unknown): unknown;
export declare function _resetConfigCache(): void;
export declare function getConfig(): Config;
//# sourceMappingURL=config.d.ts.map
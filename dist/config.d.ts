import { z } from 'zod';
declare const ProviderConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    model?: string | undefined;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
}, {
    model?: string | undefined;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
}>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
declare const ConfigSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodString>;
    providers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }, {
        model?: string | undefined;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }>>>;
    browser: z.ZodDefault<z.ZodObject<{
        headless: z.ZodDefault<z.ZodBoolean>;
        sessionDir: z.ZodDefault<z.ZodString>;
        defaultAccount: z.ZodDefault<z.ZodString>;
        viewport: z.ZodDefault<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            width: number;
            height: number;
        }, {
            width: number;
            height: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        headless: boolean;
        sessionDir: string;
        defaultAccount: string;
        viewport: {
            width: number;
            height: number;
        };
    }, {
        headless?: boolean | undefined;
        sessionDir?: string | undefined;
        defaultAccount?: string | undefined;
        viewport?: {
            width: number;
            height: number;
        } | undefined;
    }>>;
    agent: z.ZodDefault<z.ZodObject<{
        maxSteps: z.ZodDefault<z.ZodNumber>;
        stepDelayMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxSteps: number;
        stepDelayMs: number;
    }, {
        maxSteps?: number | undefined;
        stepDelayMs?: number | undefined;
    }>>;
    logging: z.ZodDefault<z.ZodObject<{
        dir: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dir: string;
    }, {
        dir?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    providers: Record<string, {
        model?: string | undefined;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }>;
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
}, {
    provider?: string | undefined;
    providers?: Record<string, {
        model?: string | undefined;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }> | undefined;
    browser?: {
        headless?: boolean | undefined;
        sessionDir?: string | undefined;
        defaultAccount?: string | undefined;
        viewport?: {
            width: number;
            height: number;
        } | undefined;
    } | undefined;
    agent?: {
        maxSteps?: number | undefined;
        stepDelayMs?: number | undefined;
    } | undefined;
    logging?: {
        dir?: string | undefined;
    } | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare function _resolveEnvVars(obj: unknown): unknown;
export declare function _resetConfigCache(): void;
export declare function getConfig(): Config;
export {};
//# sourceMappingURL=config.d.ts.map
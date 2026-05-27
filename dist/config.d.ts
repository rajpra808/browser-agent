import { z } from 'zod';
declare const ProviderConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
declare const ConfigSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodString>;
    providers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    browser: z.ZodDefault<z.ZodObject<{
        headless: z.ZodDefault<z.ZodBoolean>;
        sessionDir: z.ZodDefault<z.ZodString>;
        defaultAccount: z.ZodDefault<z.ZodString>;
        viewport: z.ZodDefault<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    agent: z.ZodDefault<z.ZodObject<{
        maxSteps: z.ZodDefault<z.ZodNumber>;
        stepDelayMs: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    logging: z.ZodDefault<z.ZodObject<{
        dir: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Config = z.infer<typeof ConfigSchema>;
export declare function _resolveEnvVars(obj: unknown): unknown;
export declare function _resetConfigCache(): void;
export declare function getConfig(): Config;
export {};
//# sourceMappingURL=config.d.ts.map
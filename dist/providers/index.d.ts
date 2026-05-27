import { AIProvider } from './base';
import { ProviderConfig } from '../config';
export declare const PROVIDER_MODELS: Record<string, string[]>;
export declare const PROVIDERS: string[];
export declare function listModels(providerName: string, baseUrl?: string): Promise<string[]>;
export declare function createProvider(name: string, config: ProviderConfig): AIProvider;
//# sourceMappingURL=index.d.ts.map
import { Settings, CreateSettings } from '../types';
export declare class SettingsModel {
    static create(settingsData: CreateSettings): Promise<Settings>;
    static get(): Promise<Settings | null>;
    static findFirst(): Promise<Settings | null>;
    static update(id: string, updateData: Partial<CreateSettings>): Promise<Settings | null>;
    static update(updateData: Partial<CreateSettings>): Promise<Settings | null>;
    static updateWhatsAppConfig(apiKey: string, endpointUrl: string): Promise<Settings | null>;
    static updateERPConfig(baseUrl: string, authToken: string): Promise<Settings | null>;
    static updateWebchatSnippet(snippetId: string): Promise<Settings | null>;
    static isConfigurationComplete(): Promise<{
        isComplete: boolean;
        missingFields: string[];
    }>;
    static reset(): Promise<boolean>;
}
//# sourceMappingURL=Settings.d.ts.map
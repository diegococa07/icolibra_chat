import { SystemMessage } from '../types';
export declare class SystemMessageModel {
    static findAll(): Promise<SystemMessage[]>;
    static findByKey(messageKey: string): Promise<SystemMessage | null>;
    static findById(id: string): Promise<SystemMessage | null>;
    static updateByKey(messageKey: string, content: string): Promise<SystemMessage | null>;
    static create(messageKey: string, content: string, description?: string): Promise<SystemMessage>;
    static delete(messageKey: string): Promise<boolean>;
    static getMessageContent(messageKey: string): Promise<string | null>;
    static replacePlaceholders(content: string, placeholders: Record<string, string>): string;
    static getFormattedMessage(messageKey: string, placeholders?: Record<string, string>): Promise<string | null>;
}
//# sourceMappingURL=SystemMessage.d.ts.map
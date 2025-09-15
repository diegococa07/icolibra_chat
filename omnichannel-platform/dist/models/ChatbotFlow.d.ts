import { ChatbotFlow, CreateChatbotFlow } from '../types';
export declare class ChatbotFlowModel {
    static create(flowData: CreateChatbotFlow): Promise<ChatbotFlow>;
    static findById(id: string): Promise<ChatbotFlow | null>;
    static findByName(name: string): Promise<ChatbotFlow | null>;
    static findAll(): Promise<ChatbotFlow[]>;
    static findAllActive(): Promise<ChatbotFlow[]>;
    static findMainActive(): Promise<ChatbotFlow | null>;
    static findActive(): Promise<ChatbotFlow | null>;
    static update(id: string, updateData: Partial<CreateChatbotFlow>): Promise<ChatbotFlow | null>;
    static activate(id: string): Promise<ChatbotFlow | null>;
    static deactivate(id: string): Promise<ChatbotFlow | null>;
    static deactivateAll(): Promise<number>;
    static delete(id: string): Promise<boolean>;
    static duplicate(id: string, newName: string): Promise<ChatbotFlow | null>;
    static validateFlowDefinition(flowDefinition: any): {
        isValid: boolean;
        errors: string[];
    };
    static countByStatus(): Promise<{
        active: number;
        inactive: number;
    }>;
    static findByDateRange(startDate: Date, endDate: Date): Promise<ChatbotFlow[]>;
    static exportFlow(id: string): Promise<{
        metadata: {
            id: string;
            name: string;
            exported_at: Date;
            version: string;
        };
        flow: ChatbotFlow;
    } | null>;
    static importFlow(importData: {
        metadata: any;
        flow: any;
    }, newName?: string): Promise<ChatbotFlow>;
}
//# sourceMappingURL=ChatbotFlow.d.ts.map
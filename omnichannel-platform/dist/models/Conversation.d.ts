import { Conversation, CreateConversation, ConversationStatus } from '../types';
export declare class ConversationModel {
    static create(conversationData: CreateConversation): Promise<Conversation>;
    static findById(id: string): Promise<Conversation | null>;
    static findByCustomer(customerIdentifier: string): Promise<Conversation[]>;
    static findByStatus(status: ConversationStatus): Promise<Conversation[]>;
    static findByAssignee(assigneeId: string): Promise<Conversation[]>;
    static findByQueue(queue: string): Promise<Conversation[]>;
    static findAll(limit?: number, offset?: number): Promise<{
        conversations: Conversation[];
        total: number;
    }>;
    static update(id: string, updateData: Partial<CreateConversation>): Promise<Conversation | null>;
    static assignToAgent(id: string, assigneeId: string): Promise<Conversation | null>;
    static close(id: string): Promise<Conversation | null>;
    static reopen(id: string): Promise<Conversation | null>;
    static transferToQueue(id: string, queue: string): Promise<Conversation | null>;
    static delete(id: string): Promise<boolean>;
    static getStats(): Promise<{
        total: number;
        byStatus: {
            status: ConversationStatus;
            count: number;
        }[];
        byChannel: {
            channel_type: string;
            count: number;
        }[];
        avgResponseTime: number;
    }>;
}
//# sourceMappingURL=Conversation.d.ts.map
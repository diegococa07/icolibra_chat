import { Message, CreateMessage, SenderType } from '../types';
export declare class MessageModel {
    static create(messageData: CreateMessage): Promise<Message>;
    static findById(id: string): Promise<Message | null>;
    static findByConversation(conversationId: string, limit?: number, offset?: number): Promise<{
        messages: Message[];
        total: number;
    }>;
    static findBySenderType(senderType: SenderType, limit?: number, offset?: number): Promise<{
        messages: Message[];
        total: number;
    }>;
    static findByAgent(agentId: string, limit?: number, offset?: number): Promise<{
        messages: Message[];
        total: number;
    }>;
    static findLatestByConversation(conversationId: string, limit?: number): Promise<Message[]>;
    static findByContentType(contentType: string, limit?: number, offset?: number): Promise<{
        messages: Message[];
        total: number;
    }>;
    static update(id: string, updateData: Partial<CreateMessage>): Promise<Message | null>;
    static delete(id: string): Promise<boolean>;
    static deleteByConversation(conversationId: string): Promise<number>;
    static findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<{
        messages: Message[];
        total: number;
    }>;
    static getStats(): Promise<{
        total: number;
        bySenderType: {
            sender_type: SenderType;
            count: number;
        }[];
        byContentType: {
            content_type: string;
            count: number;
        }[];
        messagesPerDay: {
            date: string;
            count: number;
        }[];
    }>;
    static findConversationsWithRecentMessages(hours?: number): Promise<any[]>;
}
//# sourceMappingURL=Message.d.ts.map
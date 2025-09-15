import { Server as HTTPServer } from 'http';
interface ConnectedUser {
    userId: string;
    socketId: string;
    role: 'ADMIN' | 'AGENT';
    connectedAt: Date;
}
interface NotificationEvent {
    type: 'NEW_CONVERSATION' | 'CONVERSATION_UPDATED' | 'MESSAGE_RECEIVED' | 'CONVERSATION_ASSIGNED' | 'CONVERSATION_CLOSED';
    data: any;
    targetRoles?: ('ADMIN' | 'AGENT')[];
    targetUsers?: string[];
}
declare class SocketManager {
    private io;
    private connectedUsers;
    initialize(server: HTTPServer): void;
    emitNotification(event: NotificationEvent): void;
    emitToConversation(conversationId: string, event: string, data: any): void;
    getConnectedUsers(): ConnectedUser[];
    getConnectedUsersByRole(role: 'ADMIN' | 'AGENT'): ConnectedUser[];
    isUserConnected(userId: string): boolean;
    getConnectionStats(): {
        totalConnected: number;
        adminCount: number;
        agentCount: number;
        connections: ConnectedUser[];
    };
}
export declare const socketManager: SocketManager;
export declare const emitNewConversation: (conversationData: any) => void;
export declare const emitConversationUpdated: (conversationData: any, targetUsers?: string[]) => void;
export declare const emitMessageReceived: (messageData: any, conversationId: string) => void;
export declare const emitConversationAssigned: (conversationData: any, assigneeId: string) => void;
export declare const emitConversationClosed: (conversationData: any) => void;
export {};
//# sourceMappingURL=socketManager.d.ts.map
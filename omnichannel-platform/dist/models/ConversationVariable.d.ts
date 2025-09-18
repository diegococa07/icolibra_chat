import { ConversationVariable } from '../types';
export declare class ConversationVariableModel {
    static upsert(conversationId: string, variableName: string, variableValue: string): Promise<ConversationVariable>;
    static findByConversationId(conversationId: string): Promise<ConversationVariable[]>;
    static findByConversationAndName(conversationId: string, variableName: string): Promise<ConversationVariable | null>;
    static getVariableValue(conversationId: string, variableName: string): Promise<string | null>;
    static getVariablesAsObject(conversationId: string): Promise<Record<string, string>>;
    static deleteVariable(conversationId: string, variableName: string): Promise<boolean>;
    static deleteAllByConversation(conversationId: string): Promise<number>;
    static exists(conversationId: string, variableName: string): Promise<boolean>;
    static countByConversation(conversationId: string): Promise<number>;
    static findConversationsWithVariable(variableName: string, variableValue?: string): Promise<string[]>;
    static cleanupOldVariables(daysOld?: number): Promise<number>;
}
//# sourceMappingURL=ConversationVariable.d.ts.map
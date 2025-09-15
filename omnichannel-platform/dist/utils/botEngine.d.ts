import { FlowDefinition, FlowNode, BotResponse, ERPResponse } from '../types';
export declare class BotEngine {
    static findInitialNode(flowDefinition: FlowDefinition): FlowNode | null;
    static findNextNode(currentNodeId: string, userResponse: string, flowDefinition: FlowDefinition, buttonIndex?: number): FlowNode | null;
    static processNode(node: FlowNode, conversationId: string, flowDefinition: FlowDefinition, userData?: any): Promise<BotResponse>;
    static processSendMessageNode(node: FlowNode): BotResponse;
    static processMenuButtonsNode(node: FlowNode): BotResponse;
    static processIntegrationNode(node: FlowNode, conversationId: string, userData: any): Promise<BotResponse>;
    static processTransferNode(node: FlowNode): BotResponse;
    static processUserInput(conversationId: string, userInput: string, flowDefinition: FlowDefinition, buttonIndex?: number): Promise<BotResponse>;
    static findNodeByContent(content: string, flowDefinition: FlowDefinition): FlowNode | null;
    static callERPAPI(action: string, data: any): Promise<ERPResponse>;
    static formatERPResponse(action: string, data: any): string;
}
//# sourceMappingURL=botEngine.d.ts.map
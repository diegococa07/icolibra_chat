export declare enum UserRole {
    ADMIN = "ADMIN",
    AGENT = "AGENT"
}
export declare enum ChannelType {
    WHATSAPP = "WHATSAPP",
    WEBCHAT = "WEBCHAT"
}
export declare enum ConversationStatus {
    BOT = "BOT",
    QUEUED = "QUEUED",
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}
export declare enum SenderType {
    CUSTOMER = "CUSTOMER",
    BOT = "BOT",
    AGENT = "AGENT"
}
export interface User {
    id: string;
    email: string;
    full_name?: string;
    encrypted_password: string;
    role: UserRole;
    two_factor_secret?: string;
    is_two_factor_enabled: boolean;
    created_at: Date;
}
export interface Settings {
    id: string;
    whatsapp_api_key?: string;
    whatsapp_endpoint_url?: string;
    erp_api_base_url?: string;
    erp_api_auth_token?: string;
    webchat_snippet_id?: string;
    updated_at?: Date;
}
export interface Channel {
    id: string;
    type: ChannelType;
    is_active: boolean;
}
export interface Conversation {
    id: string;
    customer_identifier?: string;
    channel_id: string;
    status: ConversationStatus;
    assignee_id?: string;
    queue?: string;
    external_protocol?: string;
    created_at: Date;
    closed_at?: Date;
}
export interface Message {
    id: string;
    conversation_id: string;
    sender_type: SenderType;
    sender_id?: string;
    content_type: string;
    content: string;
    created_at: Date;
}
export interface ChatbotFlow {
    id: string;
    name: string;
    flow_definition: any;
    is_active: boolean;
}
export interface CreateUser {
    email: string;
    full_name?: string;
    encrypted_password: string;
    role: UserRole;
    two_factor_secret?: string;
    is_two_factor_enabled?: boolean;
}
export interface CreateSettings {
    whatsapp_api_key?: string;
    whatsapp_endpoint_url?: string;
    erp_api_base_url?: string;
    erp_api_auth_token?: string;
    webchat_snippet_id?: string;
}
export interface CreateChannel {
    type: ChannelType;
    is_active?: boolean;
}
export interface CreateConversation {
    customer_identifier?: string;
    channel_id: string;
    status: ConversationStatus;
    assignee_id?: string;
    queue?: string;
    external_protocol?: string;
}
export interface CreateMessage {
    conversation_id: string;
    sender_type: SenderType;
    sender_id?: string;
    content_type?: string;
    content: string;
}
export interface CreateChatbotFlow {
    name: string;
    flow_definition: any;
    is_active?: boolean;
}
export interface BotResponse {
    type: 'message' | 'menu' | 'input_request' | 'transfer' | 'error';
    content: string;
    buttons?: string[];
    next_node_id?: string;
    requires_input?: boolean;
    input_type?: 'text' | 'cpf' | 'email' | 'phone';
    transfer_queue?: string;
    conversation_id?: string;
}
export interface FlowExecution {
    conversation_id: string;
    current_node_id: string;
    flow_data: object;
    user_data: object;
    awaiting_input?: boolean;
    input_type?: string;
}
export interface ERPRequest {
    action: string;
    data: object;
}
export interface ERPResponse {
    success: boolean;
    data?: object;
    error?: string;
    message: string;
}
export interface WebchatMessage {
    id: string;
    type: 'bot' | 'user';
    content: string;
    timestamp: string;
    buttons?: string[];
}
export interface WebchatState {
    isOpen: boolean;
    conversationId?: string;
    messages: WebchatMessage[];
    isLoading: boolean;
    awaitingInput?: boolean;
    inputType?: string;
}
export interface FlowNode {
    id: string;
    type: 'sendMessage' | 'menuButtons' | 'integration' | 'transfer';
    position: {
        x: number;
        y: number;
    };
    data: {
        message?: string;
        buttons?: string[];
        action?: string;
        input?: string;
        queue?: string;
    };
}
export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}
export interface FlowDefinition {
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport?: {
        x: number;
        y: number;
        zoom: number;
    };
}
//# sourceMappingURL=index.d.ts.map
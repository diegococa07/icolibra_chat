export declare class ERPIntegration {
    /**
     * Função principal que é chamada automaticamente quando uma conversa é encerrada
     * @param conversationId ID da conversa que foi encerrada
     */
    static processConversationClosure(conversationId: string): Promise<void>;
    /**
     * Buscar configurações do ERP no banco de dados
     */
    private static getERPSettings;
    /**
     * Montar payload para envio ao ERP
     */
    private static buildERPPayload;
    /**
     * Enviar dados para o ERP
     */
    private static sendToERP;
    /**
     * Registrar falha de integração para possível retry futuro
     */
    private static logRegistrationFailure;
    /**
     * Função para retry manual de conversas que falharam
     * Pode ser chamada por um endpoint administrativo
     */
    static retryFailedRegistration(conversationId: string): Promise<boolean>;
    /**
     * Função para testar conectividade com o ERP
     */
    static testERPConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=erpIntegration.d.ts.map
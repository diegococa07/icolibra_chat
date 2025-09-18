export declare class DemoModeUtils {
    /**
     * Detecta se estamos no modo de demonstração
     * Verifica se existe um usuário demo@plataforma.com
     */
    static isDemoMode(): Promise<boolean>;
    /**
     * Verifica se um usuário específico é o usuário demo
     */
    static isUserDemo(userEmail: string): Promise<boolean>;
    /**
     * Obter URL base para API baseada no modo (demo ou produção)
     */
    static getApiBaseUrl(): Promise<string>;
    /**
     * Obter URL completa para endpoint do ERP (mock ou real)
     */
    static getErpEndpointUrl(endpoint: string): Promise<string>;
    /**
     * Log específico para modo demo
     */
    static logDemo(message: string, data?: any): void;
    /**
     * Obter configurações específicas para demo
     */
    static getDemoConfig(): {
        demoUserEmail: string;
        demoPassword: string;
        demoCompany: string;
        demoTeam: string;
        mockClients: {
            '11111111111': {
                nome: string;
                status: string;
                email: string;
                telefone: string;
            };
            '22222222222': {
                nome: string;
                status: string;
                email: string;
                telefone: string;
            };
        };
    };
}
//# sourceMappingURL=demoMode.d.ts.map
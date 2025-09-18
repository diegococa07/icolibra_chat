import { UserModel } from '../models/User';

export class DemoModeUtils {
  
  /**
   * Detecta se estamos no modo de demonstração
   * Verifica se existe um usuário demo@plataforma.com
   */
  static async isDemoMode(): Promise<boolean> {
    try {
      const demoUser = await UserModel.findByEmail('demo@plataforma.com');
      return !!demoUser;
    } catch (error) {
      console.error('Erro ao verificar modo demo:', error);
      return false;
    }
  }
  
  /**
   * Verifica se um usuário específico é o usuário demo
   */
  static async isUserDemo(userEmail: string): Promise<boolean> {
    return userEmail === 'demo@plataforma.com';
  }
  
  /**
   * Obter URL base para API baseada no modo (demo ou produção)
   */
  static async getApiBaseUrl(): Promise<string> {
    const isDemo = await DemoModeUtils.isDemoMode();
    
    if (isDemo) {
      // No modo demo, usar nossa API mock interna
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      console.log('🎭 Modo Demo ativado - usando API Mock interna');
      return baseUrl;
    }
    
    // Modo produção - usar configurações do sistema
    return process.env.ERP_API_BASE_URL || '';
  }
  
  /**
   * Obter URL completa para endpoint do ERP (mock ou real)
   */
  static async getErpEndpointUrl(endpoint: string): Promise<string> {
    const baseUrl = await DemoModeUtils.getApiBaseUrl();
    const isDemo = await DemoModeUtils.isDemoMode();
    
    if (isDemo) {
      // No modo demo, usar endpoints mock
      return `${baseUrl}/api/mock-erp${endpoint}`;
    }
    
    // Modo produção - usar endpoints reais do ERP
    return `${baseUrl}${endpoint}`;
  }
  
  /**
   * Log específico para modo demo
   */
  static logDemo(message: string, data?: any): void {
    console.log(`🎭 [DEMO MODE] ${message}`, data || '');
  }
  
  /**
   * Obter configurações específicas para demo
   */
  static getDemoConfig() {
    return {
      demoUserEmail: 'demo@plataforma.com',
      demoPassword: 'demo123',
      demoCompany: 'Empresa Demonstração Ltda',
      demoTeam: 'Equipe Demonstração',
      mockClients: {
        '11111111111': {
          nome: 'Maria Adimplente',
          status: 'Adimplente',
          email: 'maria@email.com',
          telefone: '11999998888'
        },
        '22222222222': {
          nome: 'João Inadimplente',
          status: 'Inadimplente', 
          email: 'joao@email.com',
          telefone: '22888887777'
        }
      }
    };
  }
}


import axios from 'axios';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { SettingsModel } from '../models/Settings';
import { UserModel } from '../models/User';
import { emitConversationClosed } from './socketManager';

// Interface para o payload de registro no ERP
interface ERPRegistrationPayload {
  customer_identifier: string;
  channel_id: string;
  queue?: string;
  conversation_transcript: ConversationMessage[];
  started_at: string;
  closed_at: string;
  total_messages: number;
  had_human_intervention: boolean;
  assignee_id?: string;
}

// Interface para mensagens na transcrição
interface ConversationMessage {
  sender_type: 'CUSTOMER' | 'BOT' | 'AGENT';
  sender_id?: string;
  content: string;
  content_type: string;
  timestamp: string;
}

// Interface para resposta do ERP
interface ERPRegistrationResponse {
  success: boolean;
  protocol: string;
  message?: string;
  error?: string;
}

// Interface para configurações do ERP
interface ERPSettings {
  erp_api_base_url?: string;
  erp_api_auth_token?: string;
}

/**
 * Detecta se estamos no modo de demonstração
 * Verifica se existe um usuário demo@plataforma.com logado ou ativo
 */
async function isDemoMode(): Promise<boolean> {
  try {
    const demoUser = await UserModel.findByEmail('demo@plataforma.com');
    return !!demoUser;
  } catch (error) {
    console.error('Erro ao verificar modo demo:', error);
    return false;
  }
}

/**
 * Obter URL base para API baseada no modo (demo ou produção)
 */
async function getApiBaseUrl(): Promise<string> {
  const isDemo = await isDemoMode();
  
  if (isDemo) {
    // No modo demo, usar nossa API mock interna
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    console.log('🎭 Modo Demo ativado - usando API Mock interna');
    return baseUrl;
  }
  
  // Modo produção - usar configurações do sistema
  const settings = await SettingsModel.findFirst();
  return settings?.erp_api_base_url || '';
}

export class ERPIntegration {
  
  /**
   * Função principal que é chamada automaticamente quando uma conversa é encerrada
   * @param conversationId ID da conversa que foi encerrada
   */
  static async processConversationClosure(conversationId: string): Promise<void> {
    try {
      console.log(`🔄 Iniciando processo de registro no ERP para conversa ${conversationId}`);

      // 1. Buscar dados da conversa
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        console.error(`❌ Conversa ${conversationId} não encontrada`);
        return;
      }

      // 2. Buscar todas as mensagens da conversa
      const messages = await MessageModel.findByConversation(conversationId, 1000, 0);
      if (!messages || messages.length === 0) {
        console.warn(`⚠️ Nenhuma mensagem encontrada para conversa ${conversationId}`);
        return;
      }

      // 3. Buscar configurações do ERP
      const erpSettings = await ERPIntegration.getERPSettings();
      if (!erpSettings.erp_api_base_url || !erpSettings.erp_api_auth_token) {
        console.error('❌ Configurações do ERP não encontradas ou incompletas');
        return;
      }

      // 4. Montar payload para o ERP
      const payload = ERPIntegration.buildERPPayload(conversation, messages);

      // 5. Enviar para o ERP
      const registrationResult = await ERPIntegration.sendToERP(payload, erpSettings);

      // 6. Processar resultado
      if (registrationResult.success && registrationResult.protocol) {
        // Sucesso: salvar protocolo na conversa
        await ConversationModel.update(conversationId, {
          external_protocol: registrationResult.protocol
        });

        console.log(`✅ Conversa ${conversationId} registrada no ERP com protocolo ${registrationResult.protocol}`);

        // Emitir notificação de conversa encerrada com protocolo
        emitConversationClosed({
          ...conversation,
          external_protocol: registrationResult.protocol
        });

      } else {
        // Falha: registrar erro mas não impedir o encerramento
        console.error(`❌ Falha ao registrar conversa ${conversationId} no ERP:`, registrationResult.error);
        
        // Poderia implementar uma fila de retry aqui
        await ERPIntegration.logRegistrationFailure(conversationId, registrationResult.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error(`💥 Erro crítico no processo de registro ERP para conversa ${conversationId}:`, error);
      
      // Registrar erro mas não impedir o encerramento da conversa
      await ERPIntegration.logRegistrationFailure(conversationId, `Erro crítico: ${error}`);
    }
  }

  /**
   * Buscar configurações do ERP (com suporte ao modo demo)
   */
  private static async getERPSettings(): Promise<ERPSettings> {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const isDemo = await isDemoMode();
      
      if (isDemo) {
        // Modo demo - usar configurações mock
        return {
          erp_api_base_url: apiBaseUrl,
          erp_api_auth_token: 'demo-token-12345'
        };
      }
      
      // Modo produção - usar configurações reais
      const settings = await SettingsModel.findFirst();
      
      return {
        erp_api_base_url: settings?.erp_api_base_url,
        erp_api_auth_token: settings?.erp_api_auth_token
      };
    } catch (error) {
      console.error('Erro ao buscar configurações do ERP:', error);
      return {};
    }
  }

  /**
   * Montar payload para envio ao ERP
   */
  private static buildERPPayload(conversation: any, messages: any[]): ERPRegistrationPayload {
    // Mapear mensagens para o formato esperado pelo ERP
    const transcript: ConversationMessage[] = messages.map(message => ({
      sender_type: message.sender_type,
      sender_id: message.sender_id,
      content: message.content,
      content_type: message.content_type || 'text',
      timestamp: message.created_at
    }));

    // Verificar se houve intervenção humana
    const hadHumanIntervention = messages.some(msg => msg.sender_type === 'AGENT') || !!conversation.assignee_id;

    return {
      customer_identifier: conversation.customer_identifier || 'anonymous',
      channel_id: conversation.channel_id,
      queue: conversation.queue,
      conversation_transcript: transcript,
      started_at: conversation.created_at,
      closed_at: conversation.closed_at || new Date().toISOString(),
      total_messages: messages.length,
      had_human_intervention: hadHumanIntervention,
      assignee_id: conversation.assignee_id
    };
  }

  /**
   * Enviar dados para o ERP
   */
  private static async sendToERP(payload: ERPRegistrationPayload, settings: ERPSettings): Promise<ERPRegistrationResponse> {
    try {
      const endpoint = `${settings.erp_api_base_url}/conversations/register`;
      
      console.log(`📡 Enviando dados para ERP: ${endpoint}`);

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${settings.erp_api_auth_token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 segundos de timeout
      });

      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          protocol: response.data.protocol || response.data.ticket_number || response.data.id,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          protocol: '',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error: any) {
      console.error('Erro na chamada para o ERP:', error);

      let errorMessage = 'Erro desconhecido';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Conexão recusada - ERP pode estar offline';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Timeout na conexão com o ERP';
      } else if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        protocol: '',
        error: errorMessage
      };
    }
  }

  /**
   * Registrar falha de integração para possível retry futuro
   */
  private static async logRegistrationFailure(conversationId: string, error: string): Promise<void> {
    try {
      // Aqui poderia salvar em uma tabela de logs ou fila de retry
      console.error(`📝 Registrando falha de integração ERP:`, {
        conversation_id: conversationId,
        error: error,
        timestamp: new Date().toISOString()
      });

      // Por enquanto, apenas log. Em uma implementação mais robusta,
      // poderia salvar em uma tabela específica para retry posterior
      
    } catch (logError) {
      console.error('Erro ao registrar falha de integração:', logError);
    }
  }

  /**
   * Função para retry manual de conversas que falharam
   * Pode ser chamada por um endpoint administrativo
   */
  static async retryFailedRegistration(conversationId: string): Promise<boolean> {
    try {
      console.log(`🔄 Tentativa de retry para conversa ${conversationId}`);
      
      await ERPIntegration.processConversationClosure(conversationId);
      
      // Verificar se o protocolo foi salvo
      const conversation = await ConversationModel.findById(conversationId);
      return !!conversation?.external_protocol;
      
    } catch (error) {
      console.error(`Erro no retry da conversa ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * Função para testar conectividade com o ERP
   */
  static async testERPConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await ERPIntegration.getERPSettings();
      
      if (!settings.erp_api_base_url || !settings.erp_api_auth_token) {
        return {
          success: false,
          message: 'Configurações do ERP não encontradas'
        };
      }

      const testEndpoint = `${settings.erp_api_base_url}/health`;
      
      const response = await axios.get(testEndpoint, {
        headers: {
          'Authorization': `Bearer ${settings.erp_api_auth_token}`
        },
        timeout: 10000
      });

      if (response.status === 200) {
        return {
          success: true,
          message: 'Conexão com ERP estabelecida com sucesso'
        };
      } else {
        return {
          success: false,
          message: `ERP retornou status ${response.status}`
        };
      }

    } catch (error: any) {
      let message = 'Erro desconhecido';
      
      if (error.code === 'ECONNREFUSED') {
        message = 'Conexão recusada - ERP pode estar offline';
      } else if (error.code === 'ETIMEDOUT') {
        message = 'Timeout na conexão com o ERP';
      } else if (error.response) {
        message = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        message = error.message;
      }

      return {
        success: false,
        message
      };
    }
  }
}


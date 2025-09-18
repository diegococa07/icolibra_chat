"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERPIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const Conversation_1 = require("../models/Conversation");
const Message_1 = require("../models/Message");
const Settings_1 = require("../models/Settings");
const User_1 = require("../models/User");
const socketManager_1 = require("./socketManager");
/**
 * Detecta se estamos no modo de demonstração
 * Verifica se existe um usuário demo@plataforma.com logado ou ativo
 */
async function isDemoMode() {
    try {
        const demoUser = await User_1.UserModel.findByEmail('demo@plataforma.com');
        return !!demoUser;
    }
    catch (error) {
        console.error('Erro ao verificar modo demo:', error);
        return false;
    }
}
/**
 * Obter URL base para API baseada no modo (demo ou produção)
 */
async function getApiBaseUrl() {
    const isDemo = await isDemoMode();
    if (isDemo) {
        // No modo demo, usar nossa API mock interna
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        console.log('🎭 Modo Demo ativado - usando API Mock interna');
        return baseUrl;
    }
    // Modo produção - usar configurações do sistema
    const settings = await Settings_1.SettingsModel.findFirst();
    return settings?.erp_api_base_url || '';
}
class ERPIntegration {
    /**
     * Função principal que é chamada automaticamente quando uma conversa é encerrada
     * @param conversationId ID da conversa que foi encerrada
     */
    static async processConversationClosure(conversationId) {
        try {
            console.log(`🔄 Iniciando processo de registro no ERP para conversa ${conversationId}`);
            // 1. Buscar dados da conversa
            const conversation = await Conversation_1.ConversationModel.findById(conversationId);
            if (!conversation) {
                console.error(`❌ Conversa ${conversationId} não encontrada`);
                return;
            }
            // 2. Buscar todas as mensagens da conversa
            const messages = await Message_1.MessageModel.findByConversation(conversationId, 1000, 0);
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
                await Conversation_1.ConversationModel.update(conversationId, {
                    external_protocol: registrationResult.protocol
                });
                console.log(`✅ Conversa ${conversationId} registrada no ERP com protocolo ${registrationResult.protocol}`);
                // Emitir notificação de conversa encerrada com protocolo
                (0, socketManager_1.emitConversationClosed)({
                    ...conversation,
                    external_protocol: registrationResult.protocol
                });
            }
            else {
                // Falha: registrar erro mas não impedir o encerramento
                console.error(`❌ Falha ao registrar conversa ${conversationId} no ERP:`, registrationResult.error);
                // Poderia implementar uma fila de retry aqui
                await ERPIntegration.logRegistrationFailure(conversationId, registrationResult.error || 'Erro desconhecido');
            }
        }
        catch (error) {
            console.error(`💥 Erro crítico no processo de registro ERP para conversa ${conversationId}:`, error);
            // Registrar erro mas não impedir o encerramento da conversa
            await ERPIntegration.logRegistrationFailure(conversationId, `Erro crítico: ${error}`);
        }
    }
    /**
     * Buscar configurações do ERP (com suporte ao modo demo)
     */
    static async getERPSettings() {
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
            const settings = await Settings_1.SettingsModel.findFirst();
            return {
                erp_api_base_url: settings?.erp_api_base_url,
                erp_api_auth_token: settings?.erp_api_auth_token
            };
        }
        catch (error) {
            console.error('Erro ao buscar configurações do ERP:', error);
            return {};
        }
    }
    /**
     * Montar payload para envio ao ERP
     */
    static buildERPPayload(conversation, messages) {
        // Mapear mensagens para o formato esperado pelo ERP
        const transcript = messages.map(message => ({
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
    static async sendToERP(payload, settings) {
        try {
            const endpoint = `${settings.erp_api_base_url}/conversations/register`;
            console.log(`📡 Enviando dados para ERP: ${endpoint}`);
            const response = await axios_1.default.post(endpoint, payload, {
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
            }
            else {
                return {
                    success: false,
                    protocol: '',
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        }
        catch (error) {
            console.error('Erro na chamada para o ERP:', error);
            let errorMessage = 'Erro desconhecido';
            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Conexão recusada - ERP pode estar offline';
            }
            else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Timeout na conexão com o ERP';
            }
            else if (error.response) {
                errorMessage = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
            }
            else if (error.message) {
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
    static async logRegistrationFailure(conversationId, error) {
        try {
            // Aqui poderia salvar em uma tabela de logs ou fila de retry
            console.error(`📝 Registrando falha de integração ERP:`, {
                conversation_id: conversationId,
                error: error,
                timestamp: new Date().toISOString()
            });
            // Por enquanto, apenas log. Em uma implementação mais robusta,
            // poderia salvar em uma tabela específica para retry posterior
        }
        catch (logError) {
            console.error('Erro ao registrar falha de integração:', logError);
        }
    }
    /**
     * Função para retry manual de conversas que falharam
     * Pode ser chamada por um endpoint administrativo
     */
    static async retryFailedRegistration(conversationId) {
        try {
            console.log(`🔄 Tentativa de retry para conversa ${conversationId}`);
            await ERPIntegration.processConversationClosure(conversationId);
            // Verificar se o protocolo foi salvo
            const conversation = await Conversation_1.ConversationModel.findById(conversationId);
            return !!conversation?.external_protocol;
        }
        catch (error) {
            console.error(`Erro no retry da conversa ${conversationId}:`, error);
            return false;
        }
    }
    /**
     * Função para testar conectividade com o ERP
     */
    static async testERPConnection() {
        try {
            const settings = await ERPIntegration.getERPSettings();
            if (!settings.erp_api_base_url || !settings.erp_api_auth_token) {
                return {
                    success: false,
                    message: 'Configurações do ERP não encontradas'
                };
            }
            const testEndpoint = `${settings.erp_api_base_url}/health`;
            const response = await axios_1.default.get(testEndpoint, {
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
            }
            else {
                return {
                    success: false,
                    message: `ERP retornou status ${response.status}`
                };
            }
        }
        catch (error) {
            let message = 'Erro desconhecido';
            if (error.code === 'ECONNREFUSED') {
                message = 'Conexão recusada - ERP pode estar offline';
            }
            else if (error.code === 'ETIMEDOUT') {
                message = 'Timeout na conexão com o ERP';
            }
            else if (error.response) {
                message = `HTTP ${error.response.status}: ${error.response.statusText}`;
            }
            else if (error.message) {
                message = error.message;
            }
            return {
                success: false,
                message
            };
        }
    }
}
exports.ERPIntegration = ERPIntegration;
//# sourceMappingURL=erpIntegration.js.map
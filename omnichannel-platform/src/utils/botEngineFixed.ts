import { BotEngine } from './botEngine';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { ChatbotFlowModel } from '../models/ChatbotFlow';
import { DemoModeUtils } from './demoMode';

export class BotEngineFixed {
  
  // Processar mensagem do usuário
  static async processMessage(
    conversationId: string,
    userMessage: string,
    senderType: string = 'CUSTOMER',
    flowData?: any
  ): Promise<any> {
    try {
      console.log('🤖 [BOT] Processando mensagem:', { conversationId, userMessage, senderType });
      
      // Se não há fluxo fornecido, buscar o fluxo ativo
      if (!flowData) {
        const activeFlow = await ChatbotFlowModel.findByName('Fluxo de Demonstração');
        if (!activeFlow) {
          console.log('⚠️ [BOT] Nenhum fluxo ativo encontrado');
          return {
            content: 'Olá! 👋 Bem-vindo ao atendimento. Como posso ajudá-lo hoje?',
            buttons: []
          };
        }
        flowData = activeFlow.flow_definition;
      }
      
      // Se é a primeira mensagem (vazia), retornar mensagem de boas-vindas
      if (!userMessage || userMessage.trim() === '') {
        console.log('🎯 [BOT] Primeira mensagem - enviando boas-vindas');
        return await this.getWelcomeResponse();
      }
      
      // Processar mensagem baseada no conteúdo
      const response = await this.processUserMessage(conversationId, userMessage);
      
      // Salvar resposta do bot
      if (response.content) {
        await MessageModel.create({
          conversation_id: conversationId,
          content: response.content,
          sender_type: 'BOT',
          sender_id: null
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ [BOT] Erro ao processar mensagem:', error);
      
      // Retornar resposta de erro amigável
      const errorResponse = {
        content: 'Desculpe, ocorreu um erro. Tente novamente ou digite "atendente" para falar com nossa equipe.',
        buttons: []
      };
      
      // Salvar mensagem de erro
      try {
        await MessageModel.create({
          conversation_id: conversationId,
          content: errorResponse.content,
          sender_type: 'BOT',
          sender_id: null
        });
      } catch (saveError) {
        console.error('❌ [BOT] Erro ao salvar mensagem de erro:', saveError);
      }
      
      return errorResponse;
    }
  }
  
  // Obter resposta de boas-vindas
  static async getWelcomeResponse(): Promise<any> {
    return {
      content: 'Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração.\n\nComo posso ajudá-lo hoje?\n\n• Digite seu CPF para consultar faturas\n• Digite "atendente" para falar com nossa equipe\n• Digite "ajuda" para ver mais opções',
      buttons: [
        { text: 'Consultar Fatura', value: 'consultar_fatura' },
        { text: 'Falar com Atendente', value: 'atendente' },
        { text: 'Ajuda', value: 'ajuda' }
      ]
    };
  }
  
  // Processar mensagem do usuário
  static async processUserMessage(conversationId: string, message: string): Promise<any> {
    const lowerMessage = message.toLowerCase().trim();
    
    console.log('🔍 [BOT] Analisando mensagem:', lowerMessage);
    
    // Verificar se é solicitação de atendente
    if (lowerMessage.includes('atendente') || lowerMessage.includes('humano') || lowerMessage.includes('pessoa')) {
      return {
        content: 'Vou transferir você para um de nossos atendentes especializados. Por favor, aguarde um momento...',
        buttons: [],
        transfer: true
      };
    }
    
    // Verificar se é solicitação de ajuda
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('help') || lowerMessage.includes('opções')) {
      return {
        content: 'Aqui estão as opções disponíveis:\n\n• Digite seu CPF (formato: 111.111.111-11) para consultar faturas\n• Digite "atendente" para falar com nossa equipe\n• Digite "status" para verificar status de pedidos\n• Digite "produtos" para ver nossos produtos',
        buttons: [
          { text: 'Consultar Fatura', value: 'consultar_fatura' },
          { text: 'Falar com Atendente', value: 'atendente' },
          { text: 'Status de Pedidos', value: 'status' },
          { text: 'Produtos', value: 'produtos' }
        ]
      };
    }
    
    // Verificar se é um CPF
    const cpfPattern = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/;
    if (cpfPattern.test(message)) {
      return await this.processERPQuery('buscar_fatura_cpf', { cpf: message });
    }
    
    // Verificar comandos específicos
    switch (lowerMessage) {
      case 'consultar_fatura':
      case 'fatura':
        return {
          content: 'Para consultar sua fatura, por favor digite seu CPF no formato: 111.111.111-11',
          buttons: []
        };
        
      case 'status':
      case 'pedidos':
        return {
          content: 'Para verificar o status de seus pedidos, digite seu CPF no formato: 111.111.111-11',
          buttons: []
        };
        
      case 'produtos':
        return {
          content: 'Nossos principais produtos:\n\n• Plano Básico - R$ 29,90/mês\n• Plano Premium - R$ 59,90/mês\n• Plano Empresarial - R$ 99,90/mês\n\nDigite o nome do plano para mais informações ou "atendente" para falar conosco.',
          buttons: [
            { text: 'Plano Básico', value: 'plano_basico' },
            { text: 'Plano Premium', value: 'plano_premium' },
            { text: 'Plano Empresarial', value: 'plano_empresarial' }
          ]
        };
        
      case 'plano_basico':
        return {
          content: 'Plano Básico - R$ 29,90/mês\n\n✅ 100GB de armazenamento\n✅ Suporte por email\n✅ 1 usuário\n\nDeseja contratar? Digite "contratar básico" ou "atendente" para mais informações.',
          buttons: []
        };
        
      case 'plano_premium':
        return {
          content: 'Plano Premium - R$ 59,90/mês\n\n✅ 500GB de armazenamento\n✅ Suporte prioritário\n✅ 5 usuários\n✅ Backup automático\n\nDeseja contratar? Digite "contratar premium" ou "atendente" para mais informações.',
          buttons: []
        };
        
      case 'plano_empresarial':
        return {
          content: 'Plano Empresarial - R$ 99,90/mês\n\n✅ Armazenamento ilimitado\n✅ Suporte 24/7\n✅ Usuários ilimitados\n✅ Backup automático\n✅ API personalizada\n\nDeseja contratar? Digite "contratar empresarial" ou "atendente" para mais informações.',
          buttons: []
        };
        
      default:
        // Resposta padrão para mensagens não reconhecidas
        return {
          content: 'Não entendi sua mensagem. Posso ajudá-lo com:\n\n• Consulta de faturas (digite seu CPF)\n• Informações sobre produtos\n• Transferência para atendente\n\nDigite "ajuda" para ver todas as opções.',
          buttons: [
            { text: 'Ajuda', value: 'ajuda' },
            { text: 'Falar com Atendente', value: 'atendente' }
          ]
        };
    }
  }
  
  // Processar consulta ao ERP
  static async processERPQuery(action: string, data: any): Promise<any> {
    try {
      console.log('🔗 [BOT] Consultando ERP:', { action, data });
      
      // Usar API mock para demonstração
      const isDemo = await DemoModeUtils.isDemoMode();
      
      if (isDemo || true) { // Sempre usar modo demo por enquanto
        return await this.processERPMockQuery(action, data);
      }
      
      // Aqui seria a integração real com ERP
      return {
        content: 'Integração com sistema externo temporariamente indisponível. Tente novamente mais tarde.',
        buttons: []
      };
      
    } catch (error) {
      console.error('❌ [BOT] Erro na consulta ERP:', error);
      return {
        content: 'Erro ao consultar sistema. Tente novamente ou digite "atendente" para ajuda.',
        buttons: []
      };
    }
  }
  
  // Processar consulta mock do ERP
  static async processERPMockQuery(action: string, data: any): Promise<any> {
    console.log('🎭 [BOT] Processando consulta mock:', { action, data });
    
    if (action === 'buscar_fatura_cpf') {
      const cpf = data.cpf.replace(/\D/g, ''); // Remove formatação
      
      // Dados mock baseados no CPF
      if (cpf === '11111111111') {
        return {
          content: '✅ Fatura encontrada para Maria Silva:\n\n📄 Fatura: #2024-001\n💰 Valor: R$ 89,90\n📅 Vencimento: 15/10/2024\n✅ Status: Em dia\n\nTudo certo com sua conta! Precisa de mais alguma coisa?',
          buttons: [
            { text: 'Ver Histórico', value: 'historico' },
            { text: 'Falar com Atendente', value: 'atendente' }
          ]
        };
      } else if (cpf === '22222222222') {
        return {
          content: '⚠️ Fatura encontrada para João Santos:\n\n📄 Fatura: #2024-002\n💰 Valor: R$ 156,70\n📅 Vencimento: 05/10/2024\n❌ Status: Vencida (10 dias)\n\nSua fatura está em atraso. Gostaria de falar com um atendente para negociar?',
          buttons: [
            { text: 'Negociar Débito', value: 'atendente' },
            { text: 'Ver Detalhes', value: 'detalhes' }
          ]
        };
      } else {
        return {
          content: '❌ CPF não encontrado em nossa base de dados.\n\nVerifique se digitou corretamente ou entre em contato conosco:\n\n• Digite "atendente" para falar conosco\n• Verifique se é cliente da empresa',
          buttons: [
            { text: 'Falar com Atendente', value: 'atendente' },
            { text: 'Tentar Novamente', value: 'consultar_fatura' }
          ]
        };
      }
    }
    
    return {
      content: 'Consulta não reconhecida. Digite "ajuda" para ver as opções disponíveis.',
      buttons: []
    };
  }
}


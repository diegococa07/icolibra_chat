import axios from 'axios';
import { 
  FlowDefinition, 
  FlowNode, 
  FlowEdge, 
  BotResponse, 
  ERPRequest, 
  ERPResponse 
} from '../types';
import { MessageModel } from '../models/Message';
import { SettingsModel } from '../models/Settings';
import { SystemMessageModel } from '../models/SystemMessage';
import { WriteActionModel } from '../models/WriteAction';
import { ConversationVariableModel } from '../models/ConversationVariable';
import { DemoModeUtils } from './demoMode';

export class BotEngine {
  
  // Obter mensagem de boas-vindas customizável
  static async getWelcomeMessage(): Promise<string> {
    const welcomeMessage = await SystemMessageModel.getMessageContent('WELCOME_MESSAGE');
    return welcomeMessage || 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?';
  }

  // Obter mensagem de erro customizável
  static async getErrorMessage(): Promise<string> {
    const errorMessage = await SystemMessageModel.getMessageContent('BOT_ERROR_MESSAGE');
    return errorMessage || 'Desculpe, ocorreu um erro. Por favor, tente novamente ou aguarde um momento para falar com um atendente.';
  }
  
  // Encontrar nó inicial do fluxo
  static findInitialNode(flowDefinition: FlowDefinition): FlowNode | null {
    if (!flowDefinition.nodes || flowDefinition.nodes.length === 0) {
      return null;
    }

    // Procurar por um nó que não tem arestas de entrada
    const nodesWithIncomingEdges = new Set(
      flowDefinition.edges?.map(edge => edge.target) || []
    );

    const initialNode = flowDefinition.nodes.find(
      node => !nodesWithIncomingEdges.has(node.id)
    );

    // Se não encontrar, usar o primeiro nó
    return initialNode || flowDefinition.nodes[0];
  }

  // Encontrar próximo nó baseado na resposta do usuário
  static findNextNode(
    currentNodeId: string, 
    userResponse: string, 
    flowDefinition: FlowDefinition,
    buttonIndex?: number
  ): FlowNode | null {
    if (!flowDefinition.edges) return null;

    const currentNode = flowDefinition.nodes.find(node => node.id === currentNodeId);
    if (!currentNode) return null;

    // Para nós de menu com botões, usar o índice do botão
    if (currentNode.type === 'menuButtons' && buttonIndex !== undefined) {
      const outgoingEdges = flowDefinition.edges.filter(edge => edge.source === currentNodeId);
      if (outgoingEdges[buttonIndex]) {
        const targetNodeId = outgoingEdges[buttonIndex].target;
        return flowDefinition.nodes.find(node => node.id === targetNodeId) || null;
      }
    }

    // Para outros tipos de nós, usar a primeira aresta de saída
    const outgoingEdge = flowDefinition.edges.find(edge => edge.source === currentNodeId);
    if (outgoingEdge) {
      return flowDefinition.nodes.find(node => node.id === outgoingEdge.target) || null;
    }

    return null;
  }

  // Processar um nó específico
  static async processNode(
    node: FlowNode, 
    conversationId: string, 
    flowDefinition: FlowDefinition,
    userData: any = {}
  ): Promise<BotResponse> {
    try {
      switch (node.type) {
        case 'sendMessage':
          return this.processSendMessageNode(node);

        case 'menuButtons':
          return this.processMenuButtonsNode(node);

        case 'integration':
          return this.processIntegrationNode(node, conversationId, userData);

        case 'transfer':
          return this.processTransferNode(node);

        case 'collectInfo':
          return this.processCollectInfoNode(node, conversationId);

        case 'executeWriteAction':
          return this.processExecuteWriteActionNode(node, conversationId);

        default:
          return {
            type: 'error',
            content: 'Tipo de nó não reconhecido'
          };
      }
      } catch (error) {
        console.error('Erro ao processar nó:', error);
        const errorMessage = await BotEngine.getErrorMessage();
        return {
          type: 'error',
          content: errorMessage
        };
      }
  }

  // Processar nó "Enviar Mensagem"
  static processSendMessageNode(node: FlowNode): BotResponse {
    return {
      type: 'message',
      content: node.data.message || 'Mensagem não configurada',
      next_node_id: node.id
    };
  }

  // Processar nó "Menu com Botões"
  static processMenuButtonsNode(node: FlowNode): BotResponse {
    const buttons = node.data.buttons || [];
    const message = node.data.message || 'Escolha uma opção:';

    return {
      type: 'menu',
      content: message,
      buttons: buttons,
      next_node_id: node.id
    };
  }

  // Processar nó "Ação de Integração"
  static async processIntegrationNode(
    node: FlowNode, 
    conversationId: string, 
    userData: any
  ): Promise<BotResponse> {
    const action = node.data.action;
    const inputField = node.data.input;

    if (!action) {
      return {
        type: 'error',
        content: 'Ação de integração não configurada'
      };
    }

    // Verificar se já temos o dado necessário
    const inputValue = userData[inputField || 'input'];
    
    if (!inputValue) {
      // Solicitar o dado necessário
      let inputMessage = '';
      switch (inputField) {
        case 'cpf':
          inputMessage = 'Por favor, digite seu CPF:';
          break;
        case 'email':
          inputMessage = 'Por favor, digite seu email:';
          break;
        case 'phone':
          inputMessage = 'Por favor, digite seu telefone:';
          break;
        default:
          inputMessage = `Por favor, digite ${inputField || 'a informação necessária'}:`;
      }

      return {
        type: 'input_request',
        content: inputMessage,
        requires_input: true,
        input_type: inputField || 'text',
        next_node_id: node.id
      };
    }

    // Fazer chamada para a API externa
    try {
      const erpResponse = await this.callERPAPI(action, { [inputField || 'input']: inputValue });
      
      if (erpResponse.success) {
        return {
          type: 'message',
          content: erpResponse.message || 'Consulta realizada com sucesso!',
          next_node_id: node.id
        };
      } else {
        return {
          type: 'message',
          content: erpResponse.message || 'Não foi possível realizar a consulta.',
          next_node_id: node.id
        };
      }
    } catch (error) {
      console.error('Erro na integração:', error);
      return {
        type: 'message',
        content: 'Erro ao consultar sistema externo. Tente novamente mais tarde.',
        next_node_id: node.id
      };
    }
  }

  // Processar nó "Transferir para Atendente"
  static async processTransferNode(node: FlowNode): Promise<BotResponse> {
    const queue = node.data.queue || 'geral';
    
    // Buscar mensagem customizável
    const transferMessage = await SystemMessageModel.getMessageContent('TRANSFER_TO_AGENT_MESSAGE');
    
    return {
      type: 'transfer',
      content: transferMessage || 'Aguarde, um de nossos atendentes irá ajudá-lo em breve.',
      transfer_queue: queue
    };
  }

  // Processar entrada do usuário
  static async processUserInput(
    conversationId: string,
    userInput: string,
    flowDefinition: FlowDefinition,
    buttonIndex?: number
  ): Promise<BotResponse> {
    try {
      // Buscar última mensagem do bot para determinar contexto
      const lastBotMessage = await MessageModel.findLastBotMessage(conversationId);
      
      if (!lastBotMessage) {
        return {
          type: 'error',
          content: 'Contexto da conversa não encontrado'
        };
      }

      // Determinar nó atual baseado na última mensagem
      const currentNode = this.findNodeByContent(lastBotMessage.content, flowDefinition);
      
      if (!currentNode) {
        return {
          type: 'error',
          content: 'Estado da conversa não identificado'
        };
      }

      // Se o nó atual está aguardando input para integração
      if (currentNode.type === 'integration') {
        const inputField = currentNode.data.input || 'input';
        const userData = { [inputField]: userInput };
        
        // Processar integração com o dado fornecido
        const integrationResponse = await this.processIntegrationNode(
          currentNode, 
          conversationId, 
          userData
        );

        // Se a integração foi bem-sucedida, ir para o próximo nó
        if (integrationResponse.type === 'message') {
          const nextNode = this.findNextNode(currentNode.id, userInput, flowDefinition);
          if (nextNode) {
            const nextResponse = await this.processNode(nextNode, conversationId, flowDefinition);
            return {
              ...integrationResponse,
              content: integrationResponse.content + '\n\n' + nextResponse.content,
              buttons: nextResponse.buttons,
              type: nextResponse.type
            };
          }
        }

        return integrationResponse;
      }

      // Para outros tipos de nós, encontrar próximo nó
      const nextNode = this.findNextNode(currentNode.id, userInput, flowDefinition, buttonIndex);
      
      if (!nextNode) {
        return {
          type: 'message',
          content: 'Desculpe, não entendi sua resposta. Pode tentar novamente?'
        };
      }

      // Processar próximo nó
      return await this.processNode(nextNode, conversationId, flowDefinition);

    } catch (error) {
      console.error('Erro ao processar entrada do usuário:', error);
      return {
        type: 'error',
        content: 'Erro interno ao processar sua resposta'
      };
    }
  }

  // Encontrar nó pelo conteúdo da mensagem (método auxiliar)
  static findNodeByContent(content: string, flowDefinition: FlowDefinition): FlowNode | null {
    return flowDefinition.nodes.find(node => {
      if (node.type === 'sendMessage' && node.data.message === content) {
        return true;
      }
      if (node.type === 'menuButtons' && node.data.message === content) {
        return true;
      }
      return false;
    }) || null;
  }

  // Fazer chamada para API do ERP
  static async callERPAPI(action: string, data: any): Promise<ERPResponse> {
    try {
      // Buscar configurações do ERP
      const settings = await SettingsModel.findFirst();
      
      if (!settings || !settings.erp_api_base_url || !settings.erp_api_auth_token) {
        return {
          success: false,
          message: 'Integração com sistema externo não configurada',
          error: 'ERP_NOT_CONFIGURED'
        };
      }

      // Mapear ações para endpoints
      const actionEndpoints: { [key: string]: string } = {
        'buscar_fatura_cpf': '/faturas/buscar',
        'consultar_historico': '/clientes/historico',
        'verificar_status': '/pedidos/status',
        'buscar_produto': '/produtos/buscar'
      };

      const endpoint = actionEndpoints[action];
      if (!endpoint) {
        return {
          success: false,
          message: 'Ação não suportada',
          error: 'UNSUPPORTED_ACTION'
        };
      }

      // Fazer chamada HTTP
      const response = await axios.post(
        `${settings.erp_api_base_url}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${settings.erp_api_auth_token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos
        }
      );

      return {
        success: true,
        data: response.data,
        message: this.formatERPResponse(action, response.data)
      };

    } catch (error: any) {
      console.error('Erro na chamada ERP:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Sistema externo indisponível no momento',
          error: 'CONNECTION_REFUSED'
        };
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Erro de autenticação com sistema externo',
          error: 'UNAUTHORIZED'
        };
      }

      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Informação não encontrada no sistema',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: false,
        message: 'Erro ao consultar sistema externo',
        error: 'EXTERNAL_API_ERROR'
      };
    }
  }

  // Formatar resposta do ERP para o usuário
  static formatERPResponse(action: string, data: any): string {
    switch (action) {
      case 'buscar_fatura_cpf':
        if (data.faturas && data.faturas.length > 0) {
          const fatura = data.faturas[0];
          return `Encontrei sua fatura:\n\nVencimento: ${fatura.vencimento}\nValor: R$ ${fatura.valor}\nStatus: ${fatura.status}`;
        }
        return 'Nenhuma fatura encontrada para este CPF.';

      case 'consultar_historico':
        if (data.historico && data.historico.length > 0) {
          return `Seu histórico:\n\n${data.historico.slice(0, 3).map((item: any) => 
            `• ${item.data}: ${item.descricao}`
          ).join('\n')}`;
        }
        return 'Nenhum histórico encontrado.';

      case 'verificar_status':
        if (data.pedido) {
          return `Status do seu pedido:\n\nPedido: ${data.pedido.numero}\nStatus: ${data.pedido.status}\nPrevisão: ${data.pedido.previsao}`;
        }
        return 'Pedido não encontrado.';

      case 'buscar_produto':
        if (data.produtos && data.produtos.length > 0) {
          const produto = data.produtos[0];
          return `Produto encontrado:\n\n${produto.nome}\nPreço: R$ ${produto.preco}\nDisponibilidade: ${produto.estoque > 0 ? 'Em estoque' : 'Indisponível'}`;
        }
        return 'Produto não encontrado.';

      default:
        return 'Consulta realizada com sucesso!';
    }
  }

  // Processar nó "Coletar Informação"
  static async processCollectInfoNode(node: FlowNode, conversationId: string): Promise<BotResponse> {
    const { userMessage, validationType, variableName, errorMessage } = node.data;

    return {
      type: 'input_request',
      content: userMessage || 'Por favor, forneça a informação solicitada:',
      requires_input: true,
      input_type: validationType || 'text',
      next_node_id: node.id,
      conversation_id: conversationId,
      // Dados adicionais para processamento da resposta
      variable_name: variableName,
      error_message: errorMessage || 'Formato inválido. Tente novamente.'
    };
  }

  // Processar nó "Executar Ação de Escrita"
  static async processExecuteWriteActionNode(node: FlowNode, conversationId: string): Promise<BotResponse> {
    try {
      const { writeActionId } = node.data;

      if (!writeActionId) {
        return {
          type: 'error',
          content: 'Ação de escrita não configurada'
        };
      }

      // Buscar a ação de escrita
      const writeAction = await WriteActionModel.findById(writeActionId);
      if (!writeAction || !writeAction.is_active) {
        return {
          type: 'error',
          content: 'Ação de escrita não encontrada ou inativa'
        };
      }

      // Buscar variáveis da conversa
      const variables = await ConversationVariableModel.getVariablesAsObject(conversationId);

      // Verificar se todas as variáveis necessárias estão disponíveis
      const requiredVariables = WriteActionModel.extractVariables(writeAction.request_body_template);
      const missingVariables = requiredVariables.filter(varName => !variables[varName]);

      if (missingVariables.length > 0) {
        return {
          type: 'error',
          content: `Variáveis necessárias não encontradas: ${missingVariables.join(', ')}`
        };
      }

      // Substituir variáveis no template
      const requestBody = WriteActionModel.replaceVariables(writeAction.request_body_template, variables);

      // Executar a ação de escrita
      const success = await this.executeWriteAction(writeAction, requestBody);

      return {
        type: 'message',
        content: success 
          ? 'Dados atualizados com sucesso!' 
          : 'Erro ao atualizar os dados. Tente novamente.',
        next_node_id: node.id,
        // Indicar se foi sucesso ou falha para o fluxo
        action_result: success ? 'success' : 'failure'
      };

    } catch (error) {
      console.error('Erro ao executar ação de escrita:', error);
      return {
        type: 'error',
        content: 'Erro interno ao executar a ação'
      };
    }
  }

  // Executar ação de escrita no ERP
  static async executeWriteAction(writeAction: any, requestBody: string): Promise<boolean> {
    try {
      const isDemo = await DemoModeUtils.isDemoMode();
      
      if (isDemo) {
        // Modo demo - usar API mock interna
        DemoModeUtils.logDemo(`Executando ação: ${writeAction.name}`);
        
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/mock-erp${writeAction.endpoint_url}`;
        
        const response = await axios({
          method: writeAction.http_method,
          url: url,
          headers: {
            'Content-Type': 'application/json'
          },
          data: writeAction.http_method !== 'GET' ? JSON.parse(requestBody) : undefined,
          timeout: 30000
        });
        
        DemoModeUtils.logDemo(`Resposta da API Mock:`, response.data);
        return response.status >= 200 && response.status < 300;
        
      } else {
        // Modo produção - usar ERP real
        const settings = await SettingsModel.getSettings();
        if (!settings || !settings.erp_base_url || !settings.erp_auth_token) {
          console.error('Configurações do ERP não encontradas');
          return false;
        }

        const url = `${settings.erp_base_url}${writeAction.endpoint_url}`;
        
        const response = await axios({
          method: writeAction.http_method,
          url: url,
          headers: {
            'Authorization': `Bearer ${settings.erp_auth_token}`,
            'Content-Type': 'application/json'
          },
          data: writeAction.http_method !== 'GET' ? JSON.parse(requestBody) : undefined,
          timeout: 30000
        });

        return response.status >= 200 && response.status < 300;
      }

    } catch (error) {
      console.error('Erro ao executar ação de escrita:', error);
      return false;
    }
  }

  // Validar entrada do usuário
  static validateUserInput(input: string, validationType: string): { valid: boolean; error?: string } {
    switch (validationType) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return { valid: false, error: 'Formato de e-mail inválido' };
        }
        break;

      case 'phone':
        // Aceitar formatos: (11) 99999-9999, 11999999999, +5511999999999
        const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
        if (!phoneRegex.test(input.replace(/\s/g, ''))) {
          return { valid: false, error: 'Formato de telefone inválido' };
        }
        break;

      case 'text':
      default:
        if (!input || input.trim().length === 0) {
          return { valid: false, error: 'Campo obrigatório' };
        }
        break;
    }

    return { valid: true };
  }

  // Processar resposta do usuário para nó "Coletar Informação"
  static async processUserInputForCollectInfo(
    conversationId: string,
    userInput: string,
    nodeData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { validationType, variableName, errorMessage } = nodeData;

      // Validar entrada
      const validation = this.validateUserInput(userInput, validationType);
      if (!validation.valid) {
        return { 
          success: false, 
          error: errorMessage || validation.error || 'Entrada inválida' 
        };
      }

      // Salvar variável
      await ConversationVariableModel.upsert(conversationId, variableName, userInput.trim());

      return { success: true };

    } catch (error) {
      console.error('Erro ao processar entrada do usuário:', error);
      return { 
        success: false, 
        error: 'Erro interno ao processar a informação' 
      };
    }
  }
}


"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotEngine = void 0;
const axios_1 = __importDefault(require("axios"));
const Message_1 = require("../models/Message");
const Settings_1 = require("../models/Settings");
class BotEngine {
    // Encontrar nó inicial do fluxo
    static findInitialNode(flowDefinition) {
        if (!flowDefinition.nodes || flowDefinition.nodes.length === 0) {
            return null;
        }
        // Procurar por um nó que não tem arestas de entrada
        const nodesWithIncomingEdges = new Set(flowDefinition.edges?.map(edge => edge.target) || []);
        const initialNode = flowDefinition.nodes.find(node => !nodesWithIncomingEdges.has(node.id));
        // Se não encontrar, usar o primeiro nó
        return initialNode || flowDefinition.nodes[0];
    }
    // Encontrar próximo nó baseado na resposta do usuário
    static findNextNode(currentNodeId, userResponse, flowDefinition, buttonIndex) {
        if (!flowDefinition.edges)
            return null;
        const currentNode = flowDefinition.nodes.find(node => node.id === currentNodeId);
        if (!currentNode)
            return null;
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
    static async processNode(node, conversationId, flowDefinition, userData = {}) {
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
                default:
                    return {
                        type: 'error',
                        content: 'Tipo de nó não reconhecido'
                    };
            }
        }
        catch (error) {
            console.error('Erro ao processar nó:', error);
            return {
                type: 'error',
                content: 'Erro interno ao processar resposta'
            };
        }
    }
    // Processar nó "Enviar Mensagem"
    static processSendMessageNode(node) {
        return {
            type: 'message',
            content: node.data.message || 'Mensagem não configurada',
            next_node_id: node.id
        };
    }
    // Processar nó "Menu com Botões"
    static processMenuButtonsNode(node) {
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
    static async processIntegrationNode(node, conversationId, userData) {
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
            }
            else {
                return {
                    type: 'message',
                    content: erpResponse.message || 'Não foi possível realizar a consulta.',
                    next_node_id: node.id
                };
            }
        }
        catch (error) {
            console.error('Erro na integração:', error);
            return {
                type: 'message',
                content: 'Erro ao consultar sistema externo. Tente novamente mais tarde.',
                next_node_id: node.id
            };
        }
    }
    // Processar nó "Transferir para Atendente"
    static processTransferNode(node) {
        const queue = node.data.queue || 'geral';
        return {
            type: 'transfer',
            content: 'Aguarde, um de nossos atendentes irá ajudá-lo em breve.',
            transfer_queue: queue
        };
    }
    // Processar entrada do usuário
    static async processUserInput(conversationId, userInput, flowDefinition, buttonIndex) {
        try {
            // Buscar última mensagem do bot para determinar contexto
            const lastBotMessage = await Message_1.MessageModel.findLastBotMessage(conversationId);
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
                const integrationResponse = await this.processIntegrationNode(currentNode, conversationId, userData);
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
        }
        catch (error) {
            console.error('Erro ao processar entrada do usuário:', error);
            return {
                type: 'error',
                content: 'Erro interno ao processar sua resposta'
            };
        }
    }
    // Encontrar nó pelo conteúdo da mensagem (método auxiliar)
    static findNodeByContent(content, flowDefinition) {
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
    static async callERPAPI(action, data) {
        try {
            // Buscar configurações do ERP
            const settings = await Settings_1.SettingsModel.findFirst();
            if (!settings || !settings.erp_api_base_url || !settings.erp_api_auth_token) {
                return {
                    success: false,
                    message: 'Integração com sistema externo não configurada',
                    error: 'ERP_NOT_CONFIGURED'
                };
            }
            // Mapear ações para endpoints
            const actionEndpoints = {
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
            const response = await axios_1.default.post(`${settings.erp_api_base_url}${endpoint}`, data, {
                headers: {
                    'Authorization': `Bearer ${settings.erp_api_auth_token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos
            });
            return {
                success: true,
                data: response.data,
                message: this.formatERPResponse(action, response.data)
            };
        }
        catch (error) {
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
    static formatERPResponse(action, data) {
        switch (action) {
            case 'buscar_fatura_cpf':
                if (data.faturas && data.faturas.length > 0) {
                    const fatura = data.faturas[0];
                    return `Encontrei sua fatura:\n\nVencimento: ${fatura.vencimento}\nValor: R$ ${fatura.valor}\nStatus: ${fatura.status}`;
                }
                return 'Nenhuma fatura encontrada para este CPF.';
            case 'consultar_historico':
                if (data.historico && data.historico.length > 0) {
                    return `Seu histórico:\n\n${data.historico.slice(0, 3).map((item) => `• ${item.data}: ${item.descricao}`).join('\n')}`;
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
}
exports.BotEngine = BotEngine;
//# sourceMappingURL=botEngine.js.map
import { Request, Response } from 'express';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { ChannelModel } from '../models/Channel';
import { ChatbotFlowModel } from '../models/ChatbotFlow';
import { SettingsModel } from '../models/Settings';
import { BotEngine } from '../utils/botEngine';
import { ValidationUtils } from '../utils/auth';
import { ERPIntegration } from '../utils/erpIntegration';
import { 
  emitNewConversation, 
  emitConversationUpdated, 
  emitMessageReceived, 
  emitConversationAssigned, 
  emitConversationClosed 
} from '../utils/socketManager';
import { 
  CreateConversation, 
  CreateMessage, 
  BotResponse,
  FlowDefinition,
  FlowNode
} from '../types';

// Interfaces para requests
interface StartConversationRequest {
  customer_identifier?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface SendMessageRequest {
  content: string;
  message_type?: 'TEXT' | 'BUTTON';
  button_index?: number;
}

export class ConversationController {
  
  // POST /api/conversations/start
  // Iniciar nova conversa (público - usado pelo widget)
  static async startConversation(req: Request, res: Response): Promise<void> {
    try {
      const { 
        customer_identifier, 
        customer_name, 
        customer_email, 
        customer_phone 
      }: StartConversationRequest = req.body;

      // Buscar canal de webchat
      const webchatChannel = await ChannelModel.findByType('WEBCHAT');
      if (!webchatChannel) {
        res.status(500).json({
          error: 'Canal de webchat não configurado'
        });
        return;
      }

      // Buscar fluxo ativo
      const activeFlow = await ChatbotFlowModel.findActive();
      if (!activeFlow) {
        res.status(500).json({
          error: 'Nenhum fluxo de chatbot ativo encontrado'
        });
        return;
      }

      // Criar nova conversa
      const conversationData: CreateConversation = {
        customer_identifier: customer_identifier || `webchat_${Date.now()}`,
        channel_id: webchatChannel.id,
        status: 'BOT'
      };

      const conversation = await ConversationModel.create(conversationData);

      // Emitir notificação de nova conversa
      emitNewConversation(conversation);

      // Processar nó inicial do fluxo
      const flowDefinition = activeFlow.flow_definition as FlowDefinition;
      const initialNode = BotEngine.findInitialNode(flowDefinition);
      
      if (!initialNode) {
        res.status(500).json({
          error: 'Fluxo não possui nó inicial válido'
        });
        return;
      }

      // Processar nó inicial e gerar resposta
      const botResponse = await BotEngine.processNode(
        initialNode, 
        conversation.id, 
        flowDefinition,
        {}
      );

      // Salvar mensagem do bot
      if (botResponse.content) {
        const botMessage: CreateMessage = {
          conversation_id: conversation.id,
          sender_type: 'BOT',
          content: botResponse.content,
          content_type: botResponse.type === 'menu' ? 'MENU' : 'TEXT'
        };
        await MessageModel.create(botMessage);
      }

      res.status(201).json({
        message: 'Conversa iniciada com sucesso',
        conversation: {
          id: conversation.id,
          status: conversation.status
        },
        bot_response: botResponse
      });

    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/conversations/:id/send
  // Enviar mensagem na conversa (público - usado pelo widget)
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id: conversationId } = req.params;
      const { content, message_type = 'TEXT', button_index }: SendMessageRequest = req.body;

      if (!conversationId) {
        res.status(400).json({
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          error: 'Conteúdo da mensagem é obrigatório'
        });
        return;
      }

      // Verificar se a conversa existe
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        res.status(404).json({
          error: 'Conversa não encontrada'
        });
        return;
      }

      // Verificar se a conversa ainda está com o bot
      if (conversation.status !== 'BOT') {
        res.status(400).json({
          error: 'Conversa não está mais sendo atendida pelo bot'
        });
        return;
      }

      // Salvar mensagem do usuário
      const userMessage: CreateMessage = {
        conversation_id: conversationId,
        sender_type: 'CUSTOMER',
        content: ValidationUtils.sanitizeInput(content),
        content_type: message_type
      };
      await MessageModel.create(userMessage);
      emitMessageReceived(userMessage, conversationId);

      // Buscar fluxo ativo
      const activeFlow = await ChatbotFlowModel.findActive();
      if (!activeFlow) {
        res.status(500).json({
          error: 'Nenhum fluxo ativo encontrado'
        });
        return;
      }

      // Processar resposta do usuário
      const flowDefinition = activeFlow.flow_definition as FlowDefinition;
      const botResponse = await BotEngine.processUserInput(
        conversationId,
        content,
        flowDefinition,
        button_index
      );

      // Salvar mensagem do bot (se houver)
      if (botResponse.content) {
        const botMessage: CreateMessage = {
          conversation_id: conversationId,
          sender_type: 'BOT',
          content: botResponse.content,
          content_type: botResponse.type === 'menu' ? 'MENU' : 'TEXT'
        };
        await MessageModel.create(botMessage);
      }

      // Se for transferência, atualizar status da conversa
      if (botResponse.type === 'transfer' && botResponse.transfer_queue) {
        const updatedConversation = await ConversationModel.update(conversationId, {
          status: 'QUEUED',
          queue: botResponse.transfer_queue
        });
        // Emitir notificação de conversa atualizada
        emitConversationUpdated(updatedConversation);
      }

      res.status(200).json({
        message: 'Mensagem enviada com sucesso',
        bot_response: botResponse
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/conversations/:id/messages
  // Obter histórico de mensagens (público - usado pelo widget)
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id: conversationId } = req.params;
      const { limit = '50', offset = '0' } = req.query;

      if (!conversationId) {
        res.status(400).json({
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      // Verificar se a conversa existe
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        res.status(404).json({
          error: 'Conversa não encontrada'
        });
        return;
      }

      // Buscar mensagens
      const messages = await MessageModel.findByConversationId(
        conversationId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        message: 'Mensagens obtidas com sucesso',
        messages: messages,
        conversation: {
          id: conversation.id,
          status: conversation.status,
          queue: conversation.queue
        }
      });

    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/conversations
  // Listar conversas (protegido - dashboard)
  static async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const { 
        status, 
        queue, 
        limit = '20', 
        offset = '0' 
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (queue) filters.queue = queue;

      const conversations = await ConversationModel.findAll(
        filters,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      // Buscar última mensagem de cada conversa
      const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conversation) => {
          const lastMessage = await MessageModel.findLastByConversationId(conversation.id);
          return {
            ...conversation,
            last_message: lastMessage
          };
        })
      );

      res.status(200).json({
        message: 'Conversas listadas com sucesso',
        conversations: conversationsWithLastMessage,
        total: conversations.length
      });

    } catch (error) {
      console.error('Erro ao listar conversas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /api/conversations/:id/assign
  // Atribuir conversa a um atendente (protegido)
  static async assignConversation(req: Request, res: Response): Promise<void> {
    try {
      const { id: conversationId } = req.params;
      const { assignee_id } = req.body;
      const currentUser = (req as any).user;

      if (!conversationId) {
        res.status(400).json({
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      // Verificar se a conversa existe
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        res.status(404).json({
          error: 'Conversa não encontrada'
        });
        return;
      }

      // Atualizar conversa
      const updatedConversation = await ConversationModel.update(conversationId, {
        status: 'OPEN',
        assignee_id: assignee_id || currentUser.id
      });

      // Emitir notificação de conversa atribuída
      emitConversationAssigned(updatedConversation, updatedConversation.assignee_id!);

      // Enviar mensagem de sistema
      const systemMessage: CreateMessage = {
        conversation_id: conversationId,
        sender_type: 'BOT',
        content: 'Um atendente assumiu esta conversa e irá ajudá-lo em breve.',
        content_type: 'SYSTEM'
      };
      await MessageModel.create(systemMessage);

      res.status(200).json({
        message: 'Conversa atribuída com sucesso',
        conversation: updatedConversation
      });

    } catch (error) {
      console.error('Erro ao atribuir conversa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /api/conversations/:id/close
  // Fechar conversa (protegido)
  static async closeConversation(req: Request, res: Response): Promise<void> {
    try {
      const { id: conversationId } = req.params;
      const { reason } = req.body;

      if (!conversationId) {
        res.status(400).json({
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      // Verificar se a conversa existe
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        res.status(404).json({
          error: 'Conversa não encontrada'
        });
        return;
      }

      // Fechar conversa
      const updatedConversation = await ConversationModel.update(conversationId, {
        status: 'CLOSED',
        closed_at: new Date().toISOString()
      });

      // Enviar mensagem de encerramento
      if (reason) {
        const closeMessage: CreateMessage = {
          conversation_id: conversationId,
          sender_type: 'BOT',
          content: `Conversa encerrada. Motivo: ${reason}`,
          content_type: 'SYSTEM'
        };
        await MessageModel.create(closeMessage);
      }

      // NOVO: Processar registro no ERP de forma assíncrona
      // Não aguardar o resultado para não bloquear a resposta
      ERPIntegration.processConversationClosure(conversationId)
        .catch(error => {
          console.error(`Erro no processo de registro ERP para conversa ${conversationId}:`, error);
        });

      res.status(200).json({
        message: 'Conversa fechada com sucesso',
        conversation: updatedConversation
      });

    } catch (error) {
      console.error('Erro ao fechar conversa:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/conversations/stats
  // Obter estatísticas de conversas (protegido)
  static async getConversationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ConversationModel.getStats();

      res.status(200).json({
        message: 'Estatísticas obtidas com sucesso',
        stats: stats
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}


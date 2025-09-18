import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController';
import { BotEngineFixed } from '../utils/botEngineFixed';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { ChatbotFlowModel } from '../models/ChatbotFlow';
import { query } from '../database/connection';

const router = Router();

// POST /api/public/conversations
// Criar nova conversa pública (sem autenticação) para demonstração
router.post('/conversations', async (req, res) => {
  try {
    const { customer_phone, customer_name, channel } = req.body;
    
    console.log('🎭 [DEMO] Criando conversa pública:', { customer_phone, customer_name, channel });
    
    // Buscar canal WEBCHAT ativo
    console.log('🔍 [DEMO] Buscando canal WEBCHAT...');
    const channelResult = await query('SELECT id FROM channels WHERE type = $1 AND is_active = true LIMIT 1', ['WEBCHAT']);
    
    console.log('📋 [DEMO] Resultado da busca de canal:', channelResult.rows);
    
    if (channelResult.rows.length === 0) {
      console.log('❌ [DEMO] Nenhum canal WEBCHAT encontrado');
      return res.status(500).json({
        success: false,
        error: 'Canal não encontrado',
        message: 'Nenhum canal WEBCHAT ativo encontrado'
      });
    }
    
    const channelId = channelResult.rows[0].id;
    console.log('✅ [DEMO] Canal encontrado:', channelId);
    
    // Criar nova conversa
    const conversationData = {
      customer_identifier: customer_phone || '+5511999999999',
      channel_id: channelId,
      status: 'BOT' as any // Forçar tipo para contornar erro TypeScript
    };
    
    console.log('📝 [DEMO] Dados da conversa:', conversationData);
    
    const conversation = await ConversationModel.create(conversationData);
    
    console.log('✅ [DEMO] Conversa criada:', conversation.id);
    
    // Resposta de boas-vindas padrão
    const botResponse = {
      content: 'Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração. Como posso ajudá-lo hoje?\n\nExperimente digitar:\n• Seu CPF (111.111.111-11 ou 222.222.222-22)\n• "menu" para ver opções\n• "ajuda" para mais informações',
      buttons: []
    };
    
    res.status(201).json({
      success: true,
      conversation: {
        id: conversation.id,
        status: conversation.status
      },
      botResponse
    });
    
  } catch (error) {
    console.error('❌ [DEMO] Erro ao criar conversa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível iniciar a conversa'
    });
  }
});

// POST /api/public/conversations/:id/messages
// Enviar mensagem em conversa pública (sem autenticação)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { content, sender_type } = req.body;
    
    console.log('🎭 [DEMO] Enviando mensagem pública:', { conversationId, content, sender_type });
    
    // Verificar se conversa existe
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      console.log('❌ [DEMO] Conversa não encontrada:', conversationId);
      return res.status(404).json({
        error: 'Conversa não encontrada',
        message: 'ID de conversa inválido'
      });
    }
    
    console.log('✅ [DEMO] Conversa encontrada:', conversation.id);
    
    // Salvar mensagem do cliente
    await MessageModel.create({
      conversation_id: conversationId,
      content: content,
      sender_type: sender_type || 'CUSTOMER',
      sender_id: null
    });
    
    console.log('💬 [DEMO] Mensagem do cliente salva');
    
    // Processar resposta do bot usando BotEngineFixed
    console.log('🤖 [DEMO] Processando resposta do bot...');
    const botResponse = await BotEngineFixed.processMessage(
      conversationId,
      content,
      sender_type || 'CUSTOMER',
      null // Sem fluxo específico, usar lógica padrão
    );
    
    console.log('✅ [DEMO] Resposta do bot gerada:', botResponse);
    
    res.json({
      success: true,
      botResponse
    });
    
  } catch (error) {
    console.error('❌ [DEMO] Erro ao processar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao processar mensagem'
    });
  }
});

// GET /api/public/conversations/:id/messages
// Buscar mensagens de uma conversa pública
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    console.log('🎭 [DEMO] Buscando mensagens públicas:', { conversationId, limit, offset });
    
    // Verificar se conversa existe
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversa não encontrada',
        message: 'ID de conversa inválido'
      });
    }
    
    // Buscar mensagens
    const messages = await MessageModel.findByConversation(conversationId, limit, offset);
    
    res.status(200).json({
      success: true,
      messages: messages || [],
      total: messages?.length || 0
    });
    
  } catch (error) {
    console.error('Erro ao buscar mensagens públicas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar mensagens'
    });
  }
});

// GET /api/public/demo/status
// Status da demonstração
router.get('/demo/status', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Demonstração ativa',
      features: [
        'Simulador WhatsApp',
        'API Mock ERP',
        'Fluxo de Chatbot Completo',
        'Dados Fictícios'
      ],
      demo_clients: {
        'CPF 111.111.111-11': 'Maria Adimplente',
        'CPF 222.222.222-22': 'João Inadimplente'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status da demo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;


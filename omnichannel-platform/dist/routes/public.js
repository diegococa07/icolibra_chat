"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const botEngine_1 = require("../utils/botEngine");
const Conversation_1 = require("../models/Conversation");
const Message_1 = require("../models/Message");
const ChatbotFlow_1 = require("../models/ChatbotFlow");
const router = (0, express_1.Router)();
// POST /api/public/conversations
// Criar nova conversa pública (sem autenticação) para demonstração
router.post('/conversations', async (req, res) => {
    try {
        const { customer_phone, customer_name, channel } = req.body;
        console.log('🎭 [DEMO] Criando conversa pública:', { customer_phone, customer_name, channel });
        // Criar nova conversa
        const conversation = await Conversation_1.ConversationModel.create({
            customer_phone: customer_phone || '+5511999999999',
            customer_name: customer_name || 'Cliente Demo',
            channel: channel || 'WHATSAPP',
            status: 'OPEN'
        });
        // Buscar fluxo de demonstração
        const flow = await ChatbotFlow_1.ChatbotFlowModel.findByName('Fluxo de Demonstração');
        let botResponse = null;
        if (flow) {
            // Processar nó inicial do fluxo
            botResponse = await botEngine_1.BotEngine.processMessage(conversation.id, '', 'CUSTOMER', flow.flow_data);
        }
        else {
            // Fallback - mensagem de boas-vindas padrão
            botResponse = {
                content: 'Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração. Como posso ajudá-lo hoje?',
                buttons: []
            };
        }
        res.status(201).json({
            success: true,
            conversation: {
                id: conversation.id,
                customer_phone: conversation.customer_phone,
                customer_name: conversation.customer_name,
                channel: conversation.channel,
                status: conversation.status
            },
            botResponse
        });
    }
    catch (error) {
        console.error('Erro ao criar conversa pública:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Falha ao criar conversa de demonstração'
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
        const conversation = await Conversation_1.ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                error: 'Conversa não encontrada',
                message: 'ID de conversa inválido'
            });
        }
        // Salvar mensagem do cliente
        await Message_1.MessageModel.create({
            conversation_id: conversationId,
            content: content,
            sender_type: sender_type || 'CUSTOMER',
            sender_id: null
        });
        // Buscar fluxo de demonstração
        const flow = await ChatbotFlow_1.ChatbotFlowModel.findByName('Fluxo de Demonstração');
        let botResponse = null;
        if (flow) {
            // Processar mensagem com o bot
            botResponse = await botEngine_1.BotEngine.processMessage(conversationId, content, sender_type || 'CUSTOMER', flow.flow_data);
        }
        else {
            // Fallback - resposta padrão
            botResponse = {
                content: 'Obrigado pela sua mensagem! Em breve um atendente entrará em contato.',
                buttons: []
            };
        }
        res.status(200).json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            botResponse
        });
    }
    catch (error) {
        console.error('Erro ao enviar mensagem pública:', error);
        res.status(500).json({
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
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        console.log('🎭 [DEMO] Buscando mensagens públicas:', { conversationId, limit, offset });
        // Verificar se conversa existe
        const conversation = await Conversation_1.ConversationModel.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                error: 'Conversa não encontrada',
                message: 'ID de conversa inválido'
            });
        }
        // Buscar mensagens
        const messages = await Message_1.MessageModel.findByConversation(conversationId, limit, offset);
        res.status(200).json({
            success: true,
            messages: messages || [],
            total: messages?.length || 0
        });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Erro ao verificar status da demo:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=public.js.map
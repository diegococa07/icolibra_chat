"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ConversationController_1 = require("../controllers/ConversationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route POST /api/conversations/start
 * @desc Iniciar nova conversa
 * @access Public (usado pelo widget)
 * @body { customer_identifier?: string, customer_name?: string, customer_email?: string, customer_phone?: string }
 * @returns { message: string, conversation: object, bot_response: object }
 */
router.post('/start', ConversationController_1.ConversationController.startConversation);
/**
 * @route POST /api/conversations/:id/send
 * @desc Enviar mensagem na conversa
 * @access Public (usado pelo widget)
 * @body { content: string, message_type?: string, button_index?: number }
 * @returns { message: string, bot_response: object }
 */
router.post('/:id/send', ConversationController_1.ConversationController.sendMessage);
/**
 * @route GET /api/conversations/:id/messages
 * @desc Obter histórico de mensagens
 * @access Public (usado pelo widget)
 * @query { limit?: number, offset?: number }
 * @returns { message: string, messages: array, conversation: object }
 */
router.get('/:id/messages', ConversationController_1.ConversationController.getMessages);
/**
 * @route GET /api/conversations
 * @desc Listar conversas
 * @access Private (dashboard)
 * @query { status?: string, queue?: string, limit?: number, offset?: number }
 * @returns { message: string, conversations: array, total: number }
 */
router.get('/', auth_1.requireAuth, ConversationController_1.ConversationController.getConversations);
/**
 * @route GET /api/conversations/stats
 * @desc Obter estatísticas de conversas
 * @access Private (dashboard)
 * @returns { message: string, stats: object }
 */
router.get('/stats', auth_1.requireAuth, ConversationController_1.ConversationController.getConversationStats);
/**
 * @route PUT /api/conversations/:id/assign
 * @desc Atribuir conversa a um atendente
 * @access Private (dashboard)
 * @body { assignee_id?: string }
 * @returns { message: string, conversation: object }
 */
router.put('/:id/assign', auth_1.requireAuth, ConversationController_1.ConversationController.assignConversation);
/**
 * @route PUT /api/conversations/:id/close
 * @desc Fechar conversa
 * @access Private (dashboard)
 * @body { reason?: string }
 * @returns { message: string, conversation: object }
 */
router.put('/:id/close', auth_1.requireAuth, ConversationController_1.ConversationController.closeConversation);
/**
 * @route POST /api/conversations/:id/agent-message
 * @desc Enviar mensagem como atendente
 * @access Private (dashboard)
 * @body { content: string }
 * @returns { message: string, data: object }
 */
router.post('/:id/agent-message', auth_1.requireAuth, ConversationController_1.ConversationController.sendAgentMessage);
exports.default = router;
//# sourceMappingURL=conversations.js.map
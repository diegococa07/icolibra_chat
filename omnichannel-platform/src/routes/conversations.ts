import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/conversations/start
 * @desc Iniciar nova conversa
 * @access Public (usado pelo widget)
 * @body { customer_identifier?: string, customer_name?: string, customer_email?: string, customer_phone?: string }
 * @returns { message: string, conversation: object, bot_response: object }
 */
router.post('/start', ConversationController.startConversation);

/**
 * @route POST /api/conversations/:id/send
 * @desc Enviar mensagem na conversa
 * @access Public (usado pelo widget)
 * @body { content: string, message_type?: string, button_index?: number }
 * @returns { message: string, bot_response: object }
 */
router.post('/:id/send', ConversationController.sendMessage);

/**
 * @route GET /api/conversations/:id/messages
 * @desc Obter histórico de mensagens
 * @access Public (usado pelo widget)
 * @query { limit?: number, offset?: number }
 * @returns { message: string, messages: array, conversation: object }
 */
router.get('/:id/messages', ConversationController.getMessages);

/**
 * @route GET /api/conversations
 * @desc Listar conversas
 * @access Private (dashboard)
 * @query { status?: string, queue?: string, limit?: number, offset?: number }
 * @returns { message: string, conversations: array, total: number }
 */
router.get('/', requireAuth, ConversationController.getConversations);

/**
 * @route GET /api/conversations/stats
 * @desc Obter estatísticas de conversas
 * @access Private (dashboard)
 * @returns { message: string, stats: object }
 */
router.get('/stats', requireAuth, ConversationController.getConversationStats);

/**
 * @route PUT /api/conversations/:id/assign
 * @desc Atribuir conversa a um atendente
 * @access Private (dashboard)
 * @body { assignee_id?: string }
 * @returns { message: string, conversation: object }
 */
router.put('/:id/assign', requireAuth, ConversationController.assignConversation);

/**
 * @route PUT /api/conversations/:id/close
 * @desc Fechar conversa
 * @access Private (dashboard)
 * @body { reason?: string }
 * @returns { message: string, conversation: object }
 */
router.put('/:id/close', requireAuth, ConversationController.closeConversation);

export default router;


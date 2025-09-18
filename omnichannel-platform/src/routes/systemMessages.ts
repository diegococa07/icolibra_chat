import { Router } from 'express';
import { SystemMessageController } from '../controllers/SystemMessageController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Todas as rotas de system-messages requerem autenticação completa
 * e permissões de Admin (apenas Admin pode gerenciar mensagens do sistema)
 */

/**
 * GET /api/system-messages
 * Lista todas as mensagens customizáveis do sistema
 * Acesso: Admin only
 */
router.get('/', requireAuth, requireAdmin, SystemMessageController.list);

/**
 * GET /api/system-messages/:key
 * Busca uma mensagem específica por chave
 * Acesso: Admin only
 */
router.get('/:key', requireAuth, requireAdmin, SystemMessageController.getByKey);

/**
 * PUT /api/system-messages/:key
 * Atualiza o conteúdo de uma mensagem específica
 * Acesso: Admin only
 */
router.put('/:key', requireAuth, requireAdmin, SystemMessageController.updateByKey);

/**
 * POST /api/system-messages
 * Cria uma nova mensagem do sistema
 * Acesso: Admin only
 */
router.post('/', requireAuth, requireAdmin, SystemMessageController.create);

/**
 * DELETE /api/system-messages/:key
 * Deleta uma mensagem do sistema
 * Acesso: Admin only
 */
router.delete('/:key', requireAuth, requireAdmin, SystemMessageController.deleteByKey);

/**
 * GET /api/system-messages/:key/content
 * Busca apenas o conteúdo de uma mensagem (usado pelo bot)
 * Acesso: Admin only
 */
router.get('/:key/content', requireAuth, requireAdmin, SystemMessageController.getContentByKey);

export default router;


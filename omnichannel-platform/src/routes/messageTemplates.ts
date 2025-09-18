import { Router } from 'express';
import MessageTemplateController from '../controllers/MessageTemplateController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Todas as rotas de templates de mensagem requerem autenticação
router.use(requireAuth);

// Listar todos os templates de mensagem
router.get('/', MessageTemplateController.listAll);

// Listar templates de mensagem por status
router.get('/status/:status', MessageTemplateController.listByStatus);

// Buscar template de mensagem por ID
router.get('/:id', MessageTemplateController.getById);

// Criar novo template de mensagem (apenas admin)
router.post('/', requireAdmin, MessageTemplateController.create);

// Atualizar template de mensagem existente (apenas admin)
router.put('/:id', requireAdmin, MessageTemplateController.update);

// Atualizar status de um template de mensagem (apenas admin)
router.patch('/:id/status', requireAdmin, MessageTemplateController.updateStatus);

// Excluir template de mensagem (apenas admin)
router.delete('/:id', requireAdmin, MessageTemplateController.delete);

export default router;


import { Router } from 'express';
import { WriteActionController } from '../controllers/WriteActionController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Todas as rotas de ações de escrita são protegidas e requerem role ADMIN

// GET /api/write-actions - Listar todas as ações de escrita
router.get('/', requireAdmin, WriteActionController.getAll);

// GET /api/write-actions/:id - Obter ação de escrita por ID
router.get('/:id', requireAdmin, WriteActionController.getById);

// POST /api/write-actions - Criar nova ação de escrita
router.post('/', requireAdmin, WriteActionController.create);

// PUT /api/write-actions/:id - Atualizar ação de escrita
router.put('/:id', requireAdmin, WriteActionController.update);

// DELETE /api/write-actions/:id - Deletar ação de escrita
router.delete('/:id', requireAdmin, WriteActionController.delete);

// POST /api/write-actions/:id/toggle - Ativar/Desativar ação de escrita
router.post('/:id/toggle', requireAdmin, WriteActionController.toggleActive);

// GET /api/write-actions/:id/variables - Extrair variáveis do template
router.get('/:id/variables', requireAdmin, WriteActionController.getVariables);

// POST /api/write-actions/validate-template - Validar template JSON
router.post('/validate-template', requireAdmin, WriteActionController.validateTemplate);

export default router;


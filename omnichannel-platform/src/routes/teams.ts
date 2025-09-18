import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Todas as rotas de teams requerem autenticação completa
 * e permissões de Admin (apenas Admin pode gerenciar equipes)
 */

/**
 * GET /api/teams
 * Lista todas as equipes
 * Acesso: Admin only
 */
router.get('/', requireAuth, requireAdmin, TeamController.list);

/**
 * GET /api/teams/:id
 * Busca uma equipe específica
 * Acesso: Admin only
 */
router.get('/:id', requireAuth, requireAdmin, TeamController.getById);

/**
 * POST /api/teams
 * Cria uma nova equipe
 * Acesso: Admin only
 */
router.post('/', requireAuth, requireAdmin, TeamController.create);

/**
 * PUT /api/teams/:id
 * Atualiza uma equipe existente
 * Acesso: Admin only
 */
router.put('/:id', requireAuth, requireAdmin, TeamController.update);

/**
 * DELETE /api/teams/:id
 * Exclui uma equipe
 * Acesso: Admin only
 */
router.delete('/:id', requireAuth, requireAdmin, TeamController.delete);

/**
 * GET /api/teams/:id/users
 * Lista usuários de uma equipe específica
 * Acesso: Admin only
 */
router.get('/:id/users', requireAuth, requireAdmin, TeamController.getTeamUsers);

export default router;


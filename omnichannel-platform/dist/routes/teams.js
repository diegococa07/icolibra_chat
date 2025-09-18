"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TeamController_1 = require("../controllers/TeamController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Todas as rotas de teams requerem autenticação completa
 * e permissões de Admin (apenas Admin pode gerenciar equipes)
 */
/**
 * GET /api/teams
 * Lista todas as equipes
 * Acesso: Admin only
 */
router.get('/', auth_1.requireAuth, auth_1.requireAdmin, TeamController_1.TeamController.list);
/**
 * GET /api/teams/:id
 * Busca uma equipe específica
 * Acesso: Admin only
 */
router.get('/:id', auth_1.requireAuth, auth_1.requireAdmin, TeamController_1.TeamController.getById);
/**
 * POST /api/teams
 * Cria uma nova equipe
 * Acesso: Admin only
 */
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, TeamController_1.TeamController.create);
/**
 * PUT /api/teams/:id
 * Atualiza uma equipe existente
 * Acesso: Admin only
 */
router.put('/:id', auth_1.requireAuth, auth_1.requireAdmin, TeamController_1.TeamController.update);
/**
 * DELETE /api/teams/:id
 * Exclui uma equipe
 * Acesso: Admin only
 */
router.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, TeamController_1.TeamController.delete);
/**
 * GET /api/teams/:id/users
 * Lista usuários de uma equipe específica
 * Acesso: Admin only
 */
router.get('/:id/users', auth_1.requireAuth, auth_1.requireAdmin, TeamController_1.TeamController.getTeamUsers);
exports.default = router;
//# sourceMappingURL=teams.js.map
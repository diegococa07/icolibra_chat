"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/users/check-initial
 * @desc Verificar se precisa criar usuário inicial
 * @access Public
 * @returns { needsInitialSetup: boolean, userCount: number }
 */
router.get('/check-initial', UserController_1.UserController.checkInitialSetup);
/**
 * @route POST /api/users/create-initial
 * @desc Criar usuário inicial (apenas se não houver usuários)
 * @access Public
 * @body { email: string, password: string, full_name?: string, role?: string }
 * @returns { message: string, user: object }
 */
router.post('/create-initial', UserController_1.UserController.createInitialUser);
/**
 * @route GET /api/users
 * @desc Listar todos os usuários AGENT
 * @access Private (Admin only)
 * @returns { message: string, users: array, total: number }
 */
router.get('/', auth_1.requireAdmin, UserController_1.UserController.listAgents);
/**
 * @route GET /api/users/stats
 * @desc Obter estatísticas de usuários
 * @access Private (Admin only)
 * @returns { message: string, stats: array }
 */
router.get('/stats', auth_1.requireAdmin, UserController_1.UserController.getUserStats);
/**
 * @route GET /api/users/:id
 * @desc Buscar usuário específico por ID
 * @access Private (Admin only)
 * @returns { message: string, user: object }
 */
router.get('/:id', auth_1.requireAdmin, UserController_1.UserController.getUserById);
/**
 * @route POST /api/users
 * @desc Criar novo usuário AGENT
 * @access Private (Admin only)
 * @body { fullName: string, email: string }
 * @returns { message: string, user: object, provisionalPassword: string }
 */
router.post('/', auth_1.requireAdmin, UserController_1.UserController.createAgent);
/**
 * @route PUT /api/users/:id
 * @desc Atualizar usuário
 * @access Private (Admin only)
 * @body { fullName?: string, email?: string }
 * @returns { message: string, user: object }
 */
router.put('/:id', auth_1.requireAdmin, UserController_1.UserController.updateUser);
/**
 * @route DELETE /api/users/:id
 * @desc Excluir usuário
 * @access Private (Admin only)
 * @returns { message: string }
 */
router.delete('/:id', auth_1.requireAdmin, UserController_1.UserController.deleteUser);
/**
 * @route POST /api/users/:id/reset-password
 * @desc Redefinir senha de um usuário
 * @access Private (Admin only)
 * @returns { message: string, newPassword: string, note: string }
 */
router.post('/:id/reset-password', auth_1.requireAdmin, UserController_1.UserController.resetUserPassword);
exports.default = router;
//# sourceMappingURL=users.js.map
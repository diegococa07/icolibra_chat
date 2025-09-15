import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/users/check-initial
 * @desc Verificar se precisa criar usuário inicial
 * @access Public
 * @returns { needsInitialSetup: boolean, userCount: number }
 */
router.get('/check-initial', UserController.checkInitialSetup);

/**
 * @route POST /api/users/create-initial
 * @desc Criar usuário inicial (apenas se não houver usuários)
 * @access Public
 * @body { email: string, password: string, full_name?: string, role?: string }
 * @returns { message: string, user: object }
 */
router.post('/create-initial', UserController.createInitialUser);

/**
 * @route GET /api/users
 * @desc Listar todos os usuários AGENT
 * @access Private (Admin only)
 * @returns { message: string, users: array, total: number }
 */
router.get('/', requireAdmin, UserController.listAgents);

/**
 * @route GET /api/users/stats
 * @desc Obter estatísticas de usuários
 * @access Private (Admin only)
 * @returns { message: string, stats: array }
 */
router.get('/stats', requireAdmin, UserController.getUserStats);

/**
 * @route GET /api/users/:id
 * @desc Buscar usuário específico por ID
 * @access Private (Admin only)
 * @returns { message: string, user: object }
 */
router.get('/:id', requireAdmin, UserController.getUserById);

/**
 * @route POST /api/users
 * @desc Criar novo usuário AGENT
 * @access Private (Admin only)
 * @body { fullName: string, email: string }
 * @returns { message: string, user: object, provisionalPassword: string }
 */
router.post('/', requireAdmin, UserController.createAgent);

/**
 * @route PUT /api/users/:id
 * @desc Atualizar usuário
 * @access Private (Admin only)
 * @body { fullName?: string, email?: string }
 * @returns { message: string, user: object }
 */
router.put('/:id', requireAdmin, UserController.updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Excluir usuário
 * @access Private (Admin only)
 * @returns { message: string }
 */
router.delete('/:id', requireAdmin, UserController.deleteUser);

/**
 * @route POST /api/users/:id/reset-password
 * @desc Redefinir senha de um usuário
 * @access Private (Admin only)
 * @returns { message: string, newPassword: string, note: string }
 */
router.post('/:id/reset-password', requireAdmin, UserController.resetUserPassword);

export default router;


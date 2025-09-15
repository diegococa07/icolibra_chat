import { Router } from 'express';
import { FlowController } from '../controllers/FlowController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/flows
 * @desc Listar todos os fluxos
 * @access Private (Admin only)
 * @returns { message: string, flows: array, total: number }
 */
router.get('/', requireAdmin, FlowController.getFlows);

/**
 * @route GET /api/flows/active
 * @desc Obter fluxo ativo
 * @access Public (usado pelo chatbot)
 * @returns { message: string, flow: object }
 */
router.get('/active', FlowController.getActiveFlow);

/**
 * @route GET /api/flows/stats
 * @desc Obter estatísticas dos fluxos
 * @access Private (Admin only)
 * @returns { message: string, stats: object }
 */
router.get('/stats', requireAdmin, FlowController.getFlowStats);

/**
 * @route GET /api/flows/:id
 * @desc Obter fluxo específico por ID
 * @access Private (Admin only)
 * @returns { message: string, flow: object }
 */
router.get('/:id', requireAdmin, FlowController.getFlowById);

/**
 * @route POST /api/flows
 * @desc Criar novo fluxo
 * @access Private (Admin only)
 * @body { name: string, description?: string, flow_definition?: object }
 * @returns { message: string, flow: object }
 */
router.post('/', requireAdmin, FlowController.createFlow);

/**
 * @route PUT /api/flows/:id
 * @desc Atualizar fluxo existente
 * @access Private (Admin only)
 * @body { name?: string, description?: string, flow_definition?: object, is_active?: boolean }
 * @returns { message: string, flow: object }
 */
router.put('/:id', requireAdmin, FlowController.updateFlow);

/**
 * @route DELETE /api/flows/:id
 * @desc Excluir fluxo
 * @access Private (Admin only)
 * @returns { message: string }
 */
router.delete('/:id', requireAdmin, FlowController.deleteFlow);

/**
 * @route POST /api/flows/:id/publish
 * @desc Publicar/ativar fluxo
 * @access Private (Admin only)
 * @returns { message: string, flow: object }
 */
router.post('/:id/publish', requireAdmin, FlowController.publishFlow);

/**
 * @route POST /api/flows/:id/unpublish
 * @desc Despublicar/desativar fluxo
 * @access Private (Admin only)
 * @returns { message: string, flow: object }
 */
router.post('/:id/unpublish', requireAdmin, FlowController.unpublishFlow);

export default router;


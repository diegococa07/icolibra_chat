"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FlowController_1 = require("../controllers/FlowController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/flows
 * @desc Listar todos os fluxos
 * @access Private (Admin only)
 * @returns { message: string, flows: array, total: number }
 */
router.get('/', auth_1.requireAdmin, FlowController_1.FlowController.getFlows);
/**
 * @route GET /api/flows/active
 * @desc Obter fluxo ativo
 * @access Public (usado pelo chatbot)
 * @returns { message: string, flow: object }
 */
router.get('/active', FlowController_1.FlowController.getActiveFlow);
/**
 * @route GET /api/flows/stats
 * @desc Obter estatísticas dos fluxos
 * @access Private (Admin only)
 * @returns { message: string, stats: object }
 */
router.get('/stats', auth_1.requireAdmin, FlowController_1.FlowController.getFlowStats);
/**
 * @route GET /api/flows/:id
 * @desc Obter fluxo específico por ID
 * @access Private (Admin only)
 * @returns { message: string, flow: object }
 */
router.get('/:id', auth_1.requireAdmin, FlowController_1.FlowController.getFlowById);
/**
 * @route POST /api/flows
 * @desc Criar novo fluxo
 * @access Private (Admin only)
 * @body { name: string, description?: string, flow_definition?: object }
 * @returns { message: string, flow: object }
 */
router.post('/', auth_1.requireAdmin, FlowController_1.FlowController.createFlow);
/**
 * @route PUT /api/flows/:id
 * @desc Atualizar fluxo existente
 * @access Private (Admin only)
 * @body { name?: string, description?: string, flow_definition?: object, is_active?: boolean }
 * @returns { message: string, flow: object }
 */
router.put('/:id', auth_1.requireAdmin, FlowController_1.FlowController.updateFlow);
/**
 * @route DELETE /api/flows/:id
 * @desc Excluir fluxo
 * @access Private (Admin only)
 * @returns { message: string }
 */
router.delete('/:id', auth_1.requireAdmin, FlowController_1.FlowController.deleteFlow);
/**
 * @route POST /api/flows/:id/publish
 * @desc Publicar/ativar fluxo
 * @access Private (Admin only)
 * @returns { message: string, flow: object }
 */
router.post('/:id/publish', auth_1.requireAdmin, FlowController_1.FlowController.publishFlow);
/**
 * @route POST /api/flows/:id/unpublish
 * @desc Despublicar/desativar fluxo
 * @access Private (Admin only)
 * @returns { message: string, flow: object }
 */
router.post('/:id/unpublish', auth_1.requireAdmin, FlowController_1.FlowController.unpublishFlow);
exports.default = router;
//# sourceMappingURL=flows.js.map
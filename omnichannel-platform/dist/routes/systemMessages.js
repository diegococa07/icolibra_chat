"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SystemMessageController_1 = require("../controllers/SystemMessageController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Todas as rotas de system-messages requerem autenticação completa
 * e permissões de Admin (apenas Admin pode gerenciar mensagens do sistema)
 */
/**
 * GET /api/system-messages
 * Lista todas as mensagens customizáveis do sistema
 * Acesso: Admin only
 */
router.get('/', auth_1.requireAuth, auth_1.requireAdmin, SystemMessageController_1.SystemMessageController.list);
/**
 * GET /api/system-messages/:key
 * Busca uma mensagem específica por chave
 * Acesso: Admin only
 */
router.get('/:key', auth_1.requireAuth, auth_1.requireAdmin, SystemMessageController_1.SystemMessageController.getByKey);
/**
 * PUT /api/system-messages/:key
 * Atualiza o conteúdo de uma mensagem específica
 * Acesso: Admin only
 */
router.put('/:key', auth_1.requireAuth, auth_1.requireAdmin, SystemMessageController_1.SystemMessageController.updateByKey);
/**
 * POST /api/system-messages
 * Cria uma nova mensagem do sistema
 * Acesso: Admin only
 */
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, SystemMessageController_1.SystemMessageController.create);
/**
 * DELETE /api/system-messages/:key
 * Deleta uma mensagem do sistema
 * Acesso: Admin only
 */
router.delete('/:key', auth_1.requireAuth, auth_1.requireAdmin, SystemMessageController_1.SystemMessageController.deleteByKey);
/**
 * GET /api/system-messages/:key/content
 * Busca apenas o conteúdo de uma mensagem (usado pelo bot)
 * Acesso: Admin only
 */
router.get('/:key/content', auth_1.requireAuth, auth_1.requireAdmin, SystemMessageController_1.SystemMessageController.getContentByKey);
exports.default = router;
//# sourceMappingURL=systemMessages.js.map
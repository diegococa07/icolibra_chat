"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WriteActionController_1 = require("../controllers/WriteActionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas as rotas de ações de escrita são protegidas e requerem role ADMIN
// GET /api/write-actions - Listar todas as ações de escrita
router.get('/', auth_1.requireAdmin, WriteActionController_1.WriteActionController.getAll);
// GET /api/write-actions/:id - Obter ação de escrita por ID
router.get('/:id', auth_1.requireAdmin, WriteActionController_1.WriteActionController.getById);
// POST /api/write-actions - Criar nova ação de escrita
router.post('/', auth_1.requireAdmin, WriteActionController_1.WriteActionController.create);
// PUT /api/write-actions/:id - Atualizar ação de escrita
router.put('/:id', auth_1.requireAdmin, WriteActionController_1.WriteActionController.update);
// DELETE /api/write-actions/:id - Deletar ação de escrita
router.delete('/:id', auth_1.requireAdmin, WriteActionController_1.WriteActionController.delete);
// POST /api/write-actions/:id/toggle - Ativar/Desativar ação de escrita
router.post('/:id/toggle', auth_1.requireAdmin, WriteActionController_1.WriteActionController.toggleActive);
// GET /api/write-actions/:id/variables - Extrair variáveis do template
router.get('/:id/variables', auth_1.requireAdmin, WriteActionController_1.WriteActionController.getVariables);
// POST /api/write-actions/validate-template - Validar template JSON
router.post('/validate-template', auth_1.requireAdmin, WriteActionController_1.WriteActionController.validateTemplate);
exports.default = router;
//# sourceMappingURL=writeActions.js.map
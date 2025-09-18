"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MockErpController_1 = require("../controllers/MockErpController");
const router = (0, express_1.Router)();
// GET /api/mock-erp/status
// Status do servidor mock
router.get('/status', MockErpController_1.MockErpController.getStatus);
// GET /api/mock-erp/clientes/:cpf
// Buscar dados do cliente por CPF
router.get('/clientes/:cpf', MockErpController_1.MockErpController.getClienteByCpf);
// GET /api/mock-erp/faturas/:cpf  
// Buscar faturas do cliente por CPF
router.get('/faturas/:cpf', MockErpController_1.MockErpController.getFaturasByCpf);
// POST /api/mock-erp/clientes/:cpf/contato
// Atualizar dados de contato do cliente
router.post('/clientes/:cpf/contato', MockErpController_1.MockErpController.updateClienteContato);
exports.default = router;
//# sourceMappingURL=mockErp.js.map
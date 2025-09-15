"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportsController_1 = require("../controllers/ReportsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas as rotas de relatórios são protegidas e requerem role ADMIN
// GET /api/reports/summary - Obter resumo de métricas
router.get('/summary', auth_1.requireAdmin, ReportsController_1.ReportsController.getSummary);
// GET /api/reports/detailed - Obter relatório detalhado com breakdown diário
router.get('/detailed', auth_1.requireAdmin, ReportsController_1.ReportsController.getDetailed);
// GET /api/reports/export - Exportar dados (JSON ou CSV)
router.get('/export', auth_1.requireAdmin, ReportsController_1.ReportsController.exportData);
exports.default = router;
//# sourceMappingURL=reports.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportsController_1 = require("../controllers/ReportsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rotas de relatórios protegidas
// GET /api/reports/summary - Obter resumo de métricas (Admin only)
router.get('/summary', auth_1.requireAdmin, ReportsController_1.ReportsController.getSummary);
// GET /api/reports/detailed - Obter relatório detalhado com breakdown diário (Admin only)
router.get('/detailed', auth_1.requireAdmin, ReportsController_1.ReportsController.getDetailed);
// GET /api/reports/export - Exportar dados (JSON ou CSV) (Admin only)
router.get('/export', auth_1.requireAdmin, ReportsController_1.ReportsController.exportData);
// GET /api/reports/performance - Obter relatórios de performance (TMA e TMR) (Admin e Supervisor)
router.get('/performance', auth_1.requireAdminOrSupervisor, ReportsController_1.ReportsController.getPerformance);
exports.default = router;
//# sourceMappingURL=reports.js.map
import { Router } from 'express';
import { ReportsController } from '../controllers/ReportsController';
import { requireAdmin, requireAdminOrSupervisor } from '../middleware/auth';

const router = Router();

// Rotas de relatórios protegidas

// GET /api/reports/summary - Obter resumo de métricas (Admin only)
router.get('/summary', requireAdmin, ReportsController.getSummary);

// GET /api/reports/detailed - Obter relatório detalhado com breakdown diário (Admin only)
router.get('/detailed', requireAdmin, ReportsController.getDetailed);

// GET /api/reports/export - Exportar dados (JSON ou CSV) (Admin only)
router.get('/export', requireAdmin, ReportsController.exportData);

// GET /api/reports/performance - Obter relatórios de performance (TMA e TMR) (Admin e Supervisor)
router.get('/performance', requireAdminOrSupervisor, ReportsController.getPerformance);

export default router;


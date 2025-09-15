import { Router } from 'express';
import { ReportsController } from '../controllers/ReportsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Todas as rotas de relatórios são protegidas e requerem role ADMIN

// GET /api/reports/summary - Obter resumo de métricas
router.get('/summary', requireAdmin, ReportsController.getSummary);

// GET /api/reports/detailed - Obter relatório detalhado com breakdown diário
router.get('/detailed', requireAdmin, ReportsController.getDetailed);

// GET /api/reports/export - Exportar dados (JSON ou CSV)
router.get('/export', requireAdmin, ReportsController.exportData);

export default router;


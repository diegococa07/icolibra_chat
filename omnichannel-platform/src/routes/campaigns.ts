import { Router } from 'express';
import { CampaignController } from '../controllers/CampaignController';
import { authMiddleware, adminOrSupervisorMiddleware } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas de leitura (disponíveis para admin e supervisor)
router.get('/', adminOrSupervisorMiddleware, CampaignController.listAll);
router.get('/status/:status', adminOrSupervisorMiddleware, CampaignController.listByStatus);
router.get('/scheduled', adminOrSupervisorMiddleware, CampaignController.listScheduledBetween);
router.get('/:id', adminOrSupervisorMiddleware, CampaignController.getById);

// Rotas de escrita (disponíveis para admin e supervisor)
router.post('/', adminOrSupervisorMiddleware, CampaignController.create);
router.put('/:id', adminOrSupervisorMiddleware, CampaignController.update);
router.patch('/:id/status', adminOrSupervisorMiddleware, CampaignController.updateStatus);
router.delete('/:id', adminOrSupervisorMiddleware, CampaignController.delete);

// Simular envio de campanha (para testes)
router.post('/:id/simulate', adminOrSupervisorMiddleware, CampaignController.simulateSend);

export default router;


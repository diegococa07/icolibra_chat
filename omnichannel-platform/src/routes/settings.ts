import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/settings
 * @desc Obter todas as configurações
 * @access Private (Admin only)
 * @returns { message: string, settings: object }
 */
router.get('/', requireAdmin, SettingsController.getSettings);

/**
 * @route PUT /api/settings
 * @desc Atualizar configurações
 * @access Private (Admin only)
 * @body { whatsappApiKey?: string, whatsappEndpointUrl?: string, erpApiBaseUrl?: string, erpApiAuthToken?: string }
 * @returns { message: string, settings: object }
 */
router.put('/', requireAdmin, SettingsController.updateSettings);

/**
 * @route POST /api/settings/test-connection
 * @desc Testar conexão com ERP
 * @access Private (Admin only)
 * @body { erpApiBaseUrl: string, erpApiAuthToken: string }
 * @returns { success: boolean, message: string, details?: string }
 */
router.post('/test-connection', requireAdmin, SettingsController.testConnection);

/**
 * @route GET /api/settings/webchat-snippet
 * @desc Obter snippet do webchat
 * @access Public
 * @returns { message: string, snippet: string, snippetId: string }
 */
router.get('/webchat-snippet', SettingsController.getWebchatSnippet);

/**
 * @route POST /api/settings/regenerate-snippet
 * @desc Regenerar ID do snippet do webchat
 * @access Private (Admin only)
 * @returns { message: string, snippetId: string }
 */
router.post('/regenerate-snippet', requireAdmin, SettingsController.regenerateSnippet);

export default router;


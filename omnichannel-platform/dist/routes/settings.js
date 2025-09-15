"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SettingsController_1 = require("../controllers/SettingsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/settings
 * @desc Obter todas as configurações
 * @access Private (Admin only)
 * @returns { message: string, settings: object }
 */
router.get('/', auth_1.requireAdmin, SettingsController_1.SettingsController.getSettings);
/**
 * @route PUT /api/settings
 * @desc Atualizar configurações
 * @access Private (Admin only)
 * @body { whatsappApiKey?: string, whatsappEndpointUrl?: string, erpApiBaseUrl?: string, erpApiAuthToken?: string }
 * @returns { message: string, settings: object }
 */
router.put('/', auth_1.requireAdmin, SettingsController_1.SettingsController.updateSettings);
/**
 * @route POST /api/settings/test-connection
 * @desc Testar conexão com ERP
 * @access Private (Admin only)
 * @body { erpApiBaseUrl: string, erpApiAuthToken: string }
 * @returns { success: boolean, message: string, details?: string }
 */
router.post('/test-connection', auth_1.requireAdmin, SettingsController_1.SettingsController.testConnection);
/**
 * @route GET /api/settings/webchat-snippet
 * @desc Obter snippet do webchat
 * @access Public
 * @returns { message: string, snippet: string, snippetId: string }
 */
router.get('/webchat-snippet', SettingsController_1.SettingsController.getWebchatSnippet);
/**
 * @route POST /api/settings/regenerate-snippet
 * @desc Regenerar ID do snippet do webchat
 * @access Private (Admin only)
 * @returns { message: string, snippetId: string }
 */
router.post('/regenerate-snippet', auth_1.requireAdmin, SettingsController_1.SettingsController.regenerateSnippet);
exports.default = router;
//# sourceMappingURL=settings.js.map
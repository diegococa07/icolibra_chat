"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomerController_1 = require("../controllers/CustomerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/customers/conversation/:conversationId
 * @desc Buscar dados do cliente baseado na conversa
 * @access Private (dashboard)
 * @returns { message: string, customer: object | null, requiresManualSearch: boolean }
 */
router.get('/conversation/:conversationId', auth_1.requireAuth, CustomerController_1.CustomerController.getCustomerByConversation);
/**
 * @route POST /api/customers/search
 * @desc Buscar cliente manualmente por documento (CPF/CNPJ)
 * @access Private (dashboard)
 * @body { document: string }
 * @returns { message: string, customer: object }
 */
router.post('/search', auth_1.requireAuth, CustomerController_1.CustomerController.searchCustomer);
/**
 * @route GET /api/customers/:identifier/invoices
 * @desc Buscar faturas do cliente
 * @access Private (dashboard)
 * @query { limit?: number, offset?: number }
 * @returns { message: string, invoices: array, total: number }
 */
router.get('/:identifier/invoices', auth_1.requireAuth, CustomerController_1.CustomerController.getCustomerInvoices);
/**
 * @route GET /api/customers/:identifier/history
 * @desc Buscar histórico do cliente
 * @access Private (dashboard)
 * @query { limit?: number, offset?: number }
 * @returns { message: string, history: array, total: number }
 */
router.get('/:identifier/history', auth_1.requireAuth, CustomerController_1.CustomerController.getCustomerHistory);
exports.default = router;
//# sourceMappingURL=customers.js.map
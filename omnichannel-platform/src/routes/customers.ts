import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/customers/conversation/:conversationId
 * @desc Buscar dados do cliente baseado na conversa
 * @access Private (dashboard)
 * @returns { message: string, customer: object | null, requiresManualSearch: boolean }
 */
router.get('/conversation/:conversationId', requireAuth, CustomerController.getCustomerByConversation);

/**
 * @route POST /api/customers/search
 * @desc Buscar cliente manualmente por documento (CPF/CNPJ)
 * @access Private (dashboard)
 * @body { document: string }
 * @returns { message: string, customer: object }
 */
router.post('/search', requireAuth, CustomerController.searchCustomer);

/**
 * @route GET /api/customers/:identifier/invoices
 * @desc Buscar faturas do cliente
 * @access Private (dashboard)
 * @query { limit?: number, offset?: number }
 * @returns { message: string, invoices: array, total: number }
 */
router.get('/:identifier/invoices', requireAuth, CustomerController.getCustomerInvoices);

/**
 * @route GET /api/customers/:identifier/history
 * @desc Buscar histórico do cliente
 * @access Private (dashboard)
 * @query { limit?: number, offset?: number }
 * @returns { message: string, history: array, total: number }
 */
router.get('/:identifier/history', requireAuth, CustomerController.getCustomerHistory);

export default router;


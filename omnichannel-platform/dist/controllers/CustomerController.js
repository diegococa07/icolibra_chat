"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const axios_1 = __importDefault(require("axios"));
const Settings_1 = require("../models/Settings");
const Conversation_1 = require("../models/Conversation");
const auth_1 = require("../utils/auth");
class CustomerController {
    // GET /api/customers/conversation/:conversationId
    // Buscar dados do cliente baseado na conversa
    static async getCustomerByConversation(req, res) {
        try {
            const { conversationId } = req.params;
            if (!conversationId) {
                res.status(400).json({
                    error: 'ID da conversa é obrigatório'
                });
                return;
            }
            // Buscar conversa
            const conversation = await Conversation_1.ConversationModel.findById(conversationId);
            if (!conversation) {
                res.status(404).json({
                    error: 'Conversa não encontrada'
                });
                return;
            }
            // Verificar se tem identificador do cliente
            if (!conversation.customer_identifier) {
                res.status(200).json({
                    message: 'Cliente não identificado nesta conversa',
                    customer: null,
                    requiresManualSearch: true
                });
                return;
            }
            // Buscar dados no ERP
            const customerData = await CustomerController.fetchCustomerFromERP(conversation.customer_identifier);
            if (customerData.success && customerData.customer) {
                res.status(200).json({
                    message: 'Dados do cliente obtidos com sucesso',
                    customer: customerData.customer,
                    requiresManualSearch: false
                });
            }
            else {
                res.status(200).json({
                    message: customerData.message || 'Cliente não encontrado no sistema',
                    customer: null,
                    requiresManualSearch: true,
                    error: customerData.error
                });
            }
        }
        catch (error) {
            console.error('Erro ao buscar cliente por conversa:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/customers/search
    // Buscar cliente manualmente por documento
    static async searchCustomer(req, res) {
        try {
            const { document } = req.body;
            if (!document || document.trim().length === 0) {
                res.status(400).json({
                    error: 'Documento (CPF/CNPJ) é obrigatório'
                });
                return;
            }
            // Sanitizar documento
            const sanitizedDocument = auth_1.ValidationUtils.sanitizeInput(document).replace(/\D/g, '');
            if (sanitizedDocument.length !== 11 && sanitizedDocument.length !== 14) {
                res.status(400).json({
                    error: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)'
                });
                return;
            }
            // Buscar dados no ERP
            const customerData = await CustomerController.fetchCustomerFromERP(sanitizedDocument);
            if (customerData.success && customerData.customer) {
                res.status(200).json({
                    message: 'Cliente encontrado com sucesso',
                    customer: customerData.customer
                });
            }
            else {
                res.status(404).json({
                    message: customerData.message || 'Cliente não encontrado',
                    error: customerData.error
                });
            }
        }
        catch (error) {
            console.error('Erro ao buscar cliente:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // Método auxiliar para buscar cliente no ERP
    static async fetchCustomerFromERP(identifier) {
        try {
            // Buscar configurações do ERP
            const settings = await Settings_1.SettingsModel.findFirst();
            if (!settings || !settings.erp_api_base_url || !settings.erp_api_auth_token) {
                return {
                    success: false,
                    message: 'Integração com ERP não configurada',
                    error: 'ERP_NOT_CONFIGURED'
                };
            }
            // Fazer chamada para a API do ERP
            const response = await axios_1.default.get(`${settings.erp_api_base_url}/customers/${identifier}`, {
                headers: {
                    'Authorization': `Bearer ${settings.erp_api_auth_token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos
            });
            // Mapear resposta do ERP para nosso formato
            const erpData = response.data;
            const customerData = {
                id: erpData.id || identifier,
                name: erpData.name || erpData.full_name || 'Nome não informado',
                email: erpData.email,
                phone: erpData.phone || erpData.mobile,
                document: erpData.document || erpData.cpf || erpData.cnpj || identifier,
                status: CustomerController.mapERPStatus(erpData.status),
                address: erpData.address ? {
                    street: erpData.address.street || '',
                    number: erpData.address.number || '',
                    city: erpData.address.city || '',
                    state: erpData.address.state || '',
                    zipCode: erpData.address.zipCode || erpData.address.zip_code || ''
                } : undefined,
                lastInvoice: erpData.lastInvoice ? {
                    id: erpData.lastInvoice.id,
                    amount: parseFloat(erpData.lastInvoice.amount || '0'),
                    dueDate: erpData.lastInvoice.dueDate || erpData.lastInvoice.due_date,
                    status: CustomerController.mapInvoiceStatus(erpData.lastInvoice.status)
                } : undefined,
                totalDebt: parseFloat(erpData.totalDebt || erpData.total_debt || '0'),
                registrationDate: erpData.registrationDate || erpData.created_at || new Date().toISOString()
            };
            return {
                success: true,
                customer: customerData,
                message: 'Cliente encontrado com sucesso'
            };
        }
        catch (error) {
            console.error('Erro na chamada ERP para cliente:', error);
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    message: 'Sistema ERP indisponível no momento',
                    error: 'CONNECTION_REFUSED'
                };
            }
            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: 'Erro de autenticação com ERP',
                    error: 'UNAUTHORIZED'
                };
            }
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Cliente não encontrado no sistema',
                    error: 'CUSTOMER_NOT_FOUND'
                };
            }
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    message: 'Timeout na consulta ao ERP',
                    error: 'TIMEOUT'
                };
            }
            return {
                success: false,
                message: 'Erro ao consultar dados do cliente',
                error: 'EXTERNAL_API_ERROR'
            };
        }
    }
    // GET /api/customers/:identifier/invoices
    // Buscar faturas do cliente
    static async getCustomerInvoices(req, res) {
        try {
            const { identifier } = req.params;
            const { limit = '10', offset = '0' } = req.query;
            if (!identifier) {
                res.status(400).json({
                    error: 'Identificador do cliente é obrigatório'
                });
                return;
            }
            // Buscar configurações do ERP
            const settings = await Settings_1.SettingsModel.findFirst();
            if (!settings || !settings.erp_api_base_url || !settings.erp_api_auth_token) {
                res.status(500).json({
                    error: 'Integração com ERP não configurada'
                });
                return;
            }
            // Fazer chamada para a API do ERP
            const response = await axios_1.default.get(`${settings.erp_api_base_url}/customers/${identifier}/invoices`, {
                headers: {
                    'Authorization': `Bearer ${settings.erp_api_auth_token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                timeout: 10000
            });
            res.status(200).json({
                message: 'Faturas obtidas com sucesso',
                invoices: response.data.invoices || response.data || [],
                total: response.data.total || 0
            });
        }
        catch (error) {
            console.error('Erro ao buscar faturas:', error);
            if (error.response?.status === 404) {
                res.status(404).json({
                    error: 'Cliente não encontrado'
                });
                return;
            }
            res.status(500).json({
                error: 'Erro ao consultar faturas do cliente'
            });
        }
    }
    // GET /api/customers/:identifier/history
    // Buscar histórico do cliente
    static async getCustomerHistory(req, res) {
        try {
            const { identifier } = req.params;
            const { limit = '20', offset = '0' } = req.query;
            if (!identifier) {
                res.status(400).json({
                    error: 'Identificador do cliente é obrigatório'
                });
                return;
            }
            // Buscar configurações do ERP
            const settings = await Settings_1.SettingsModel.findFirst();
            if (!settings || !settings.erp_api_base_url || !settings.erp_api_auth_token) {
                res.status(500).json({
                    error: 'Integração com ERP não configurada'
                });
                return;
            }
            // Fazer chamada para a API do ERP
            const response = await axios_1.default.get(`${settings.erp_api_base_url}/customers/${identifier}/history`, {
                headers: {
                    'Authorization': `Bearer ${settings.erp_api_auth_token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                timeout: 10000
            });
            res.status(200).json({
                message: 'Histórico obtido com sucesso',
                history: response.data.history || response.data || [],
                total: response.data.total || 0
            });
        }
        catch (error) {
            console.error('Erro ao buscar histórico:', error);
            if (error.response?.status === 404) {
                res.status(404).json({
                    error: 'Cliente não encontrado'
                });
                return;
            }
            res.status(500).json({
                error: 'Erro ao consultar histórico do cliente'
            });
        }
    }
    // Métodos auxiliares para mapear dados do ERP
    static mapERPStatus(status) {
        if (!status)
            return 'ACTIVE';
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus.includes('inativo') || normalizedStatus.includes('inactive')) {
            return 'INACTIVE';
        }
        if (normalizedStatus.includes('inadimplente') || normalizedStatus.includes('defaulter') ||
            normalizedStatus.includes('overdue') || normalizedStatus.includes('blocked')) {
            return 'DEFAULTER';
        }
        return 'ACTIVE';
    }
    static mapInvoiceStatus(status) {
        if (!status)
            return 'PENDING';
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus.includes('pago') || normalizedStatus.includes('paid')) {
            return 'PAID';
        }
        if (normalizedStatus.includes('vencido') || normalizedStatus.includes('overdue') ||
            normalizedStatus.includes('atrasado')) {
            return 'OVERDUE';
        }
        return 'PENDING';
    }
}
exports.CustomerController = CustomerController;
//# sourceMappingURL=CustomerController.js.map
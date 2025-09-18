import { Router } from 'express';
import { MockErpController } from '../controllers/MockErpController';

const router = Router();

// GET /api/mock-erp/status
// Status do servidor mock
router.get('/status', MockErpController.getStatus);

// GET /api/mock-erp/clientes/:cpf
// Buscar dados do cliente por CPF
router.get('/clientes/:cpf', MockErpController.getClienteByCpf);

// GET /api/mock-erp/faturas/:cpf  
// Buscar faturas do cliente por CPF
router.get('/faturas/:cpf', MockErpController.getFaturasByCpf);

// POST /api/mock-erp/clientes/:cpf/contato
// Atualizar dados de contato do cliente
router.post('/clientes/:cpf/contato', MockErpController.updateClienteContato);

// NOVOS ENDPOINTS PARA EXPANSÃO DO MODO DEMO

// GET /api/mock-erp/leitura/:cpf
// Consultar próxima leitura do medidor
router.get('/leitura/:cpf', MockErpController.getProximaLeitura);

// GET /api/mock-erp/abastecimento/:cpf
// Verificar status de abastecimento
router.get('/abastecimento/:cpf', MockErpController.getStatusAbastecimento);

// GET /api/mock-erp/simulacao-fatura/:cpf
// Simular valor da próxima fatura
router.get('/simulacao-fatura/:cpf', MockErpController.getSimulacaoFatura);

// GET /api/mock-erp/negociacao/:cpf
// Buscar proposta de negociação de débitos
router.get('/negociacao/:cpf', MockErpController.getPropostaNegociacao);

// GET /api/mock-erp/customers
// Buscar clientes com base em critérios para campanhas
router.get('/customers', MockErpController.getCustomers);

// ENDPOINTS PARA SEGMENTAÇÃO DE CAMPANHAS

// GET /api/mock-erp/regions
// Buscar regiões disponíveis para segmentação
router.get('/regions', MockErpController.getRegions);

// GET /api/mock-erp/cities
// Buscar cidades disponíveis para segmentação
router.get('/cities', MockErpController.getCities);

// GET /api/mock-erp/customer-statuses
// Buscar status de cliente disponíveis para segmentação
router.get('/customer-statuses', MockErpController.getCustomerStatuses);

export default router;


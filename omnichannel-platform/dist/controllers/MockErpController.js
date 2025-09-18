"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockErpController = void 0;
// Dados fictícios para demonstração
const MOCK_CLIENTS = {
    '11111111111': {
        nome: 'Maria Adimplente',
        status: 'Adimplente',
        email: 'maria@email.com',
        telefone: '11999998888',
        cpf: '111.111.111-11'
    },
    '22222222222': {
        nome: 'João Inadimplente',
        status: 'Inadimplente',
        email: 'joao@email.com',
        telefone: '22888887777',
        cpf: '222.222.222-22'
    }
};
const MOCK_INVOICES = {
    '22222222222': [
        {
            id: 'FAT-2024-001',
            valor: 150.75,
            vencimento: '2024-01-15',
            status: 'Em aberto',
            descricao: 'Mensalidade Janeiro 2024'
        },
        {
            id: 'FAT-2024-002',
            valor: 150.75,
            vencimento: '2024-02-15',
            status: 'Em aberto',
            descricao: 'Mensalidade Fevereiro 2024'
        }
    ]
};
class MockErpController {
    // GET /api/mock-erp/clientes/:cpf
    // Buscar dados do cliente por CPF
    static async getClienteByCpf(req, res) {
        try {
            const { cpf } = req.params;
            // Remover formatação do CPF (pontos e traços)
            const cleanCpf = cpf.replace(/[.-]/g, '');
            console.log(`[MOCK ERP] Buscando cliente com CPF: ${cpf} (limpo: ${cleanCpf})`);
            const cliente = MOCK_CLIENTS[cleanCpf];
            if (!cliente) {
                console.log(`[MOCK ERP] Cliente não encontrado para CPF: ${cpf}`);
                res.status(404).json({
                    error: 'Cliente não encontrado',
                    message: 'CPF não localizado na base de dados'
                });
                return;
            }
            console.log(`[MOCK ERP] Cliente encontrado: ${cliente.nome}`);
            res.status(200).json({
                success: true,
                data: cliente
            });
        }
        catch (error) {
            console.error('[MOCK ERP] Erro ao buscar cliente:', error);
            res.status(500).json({
                error: 'Erro interno do servidor mock',
                message: 'Falha na consulta do cliente'
            });
        }
    }
    // GET /api/mock-erp/faturas/:cpf
    // Buscar faturas do cliente por CPF
    static async getFaturasByCpf(req, res) {
        try {
            const { cpf } = req.params;
            // Remover formatação do CPF
            const cleanCpf = cpf.replace(/[.-]/g, '');
            console.log(`[MOCK ERP] Buscando faturas para CPF: ${cpf} (limpo: ${cleanCpf})`);
            const faturas = MOCK_INVOICES[cleanCpf];
            if (!faturas) {
                console.log(`[MOCK ERP] Nenhuma fatura encontrada para CPF: ${cpf}`);
                res.status(200).json({
                    success: true,
                    data: [],
                    message: 'Não há faturas em aberto para este cliente'
                });
                return;
            }
            console.log(`[MOCK ERP] ${faturas.length} fatura(s) encontrada(s) para CPF: ${cpf}`);
            res.status(200).json({
                success: true,
                data: faturas,
                total: faturas.length
            });
        }
        catch (error) {
            console.error('[MOCK ERP] Erro ao buscar faturas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor mock',
                message: 'Falha na consulta de faturas'
            });
        }
    }
    // POST /api/mock-erp/clientes/:cpf/contato
    // Atualizar dados de contato do cliente
    static async updateClienteContato(req, res) {
        try {
            const { cpf } = req.params;
            const { email, telefone } = req.body;
            // Remover formatação do CPF
            const cleanCpf = cpf.replace(/[.-]/g, '');
            console.log(`[MOCK ERP] Atualizando contato do cliente CPF: ${cpf}`);
            console.log(`[MOCK ERP] Novos dados - Email: ${email}, Telefone: ${telefone}`);
            // Verificar se cliente existe
            const cliente = MOCK_CLIENTS[cleanCpf];
            if (!cliente) {
                console.log(`[MOCK ERP] Cliente não encontrado para atualização: ${cpf}`);
                res.status(404).json({
                    error: 'Cliente não encontrado',
                    message: 'CPF não localizado na base de dados'
                });
                return;
            }
            // Simular atualização (apenas log, não persiste)
            console.log(`[MOCK ERP] SIMULAÇÃO: Atualizando dados do cliente ${cliente.nome} (${cpf})`);
            console.log(`[MOCK ERP] SIMULAÇÃO: Email: ${cliente.email} → ${email}`);
            console.log(`[MOCK ERP] SIMULAÇÃO: Telefone: ${cliente.telefone} → ${telefone}`);
            // Simular delay de processamento
            await new Promise(resolve => setTimeout(resolve, 1000));
            res.status(200).json({
                success: true,
                message: 'Dados atualizados com sucesso no sistema simulado',
                data: {
                    cpf: cpf,
                    nome: cliente.nome,
                    email_anterior: cliente.email,
                    telefone_anterior: cliente.telefone,
                    email_novo: email,
                    telefone_novo: telefone,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('[MOCK ERP] Erro ao atualizar contato:', error);
            res.status(500).json({
                error: 'Erro interno do servidor mock',
                message: 'Falha na atualização dos dados'
            });
        }
    }
    // GET /api/mock-erp/status
    // Status do servidor mock
    static async getStatus(req, res) {
        res.status(200).json({
            success: true,
            message: 'Servidor Mock ERP funcionando',
            version: '1.0.0',
            clientes_disponiveis: Object.keys(MOCK_CLIENTS).length,
            timestamp: new Date().toISOString()
        });
    }
}
exports.MockErpController = MockErpController;
//# sourceMappingURL=MockErpController.js.map
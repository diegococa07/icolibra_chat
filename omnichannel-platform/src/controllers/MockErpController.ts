import { Request, Response } from 'express';

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

export class MockErpController {
  
  // GET /api/mock-erp/clientes/:cpf
  // Buscar dados do cliente por CPF
  static async getClienteByCpf(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      
      // Remover formatação do CPF (pontos e traços)
      const cleanCpf = cpf.replace(/[.-]/g, '');
      
      console.log(`[MOCK ERP] Buscando cliente com CPF: ${cpf} (limpo: ${cleanCpf})`);
      
      const cliente = MOCK_CLIENTS[cleanCpf as keyof typeof MOCK_CLIENTS];
      
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
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar cliente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na consulta do cliente'
      });
    }
  }
  
  // GET /api/mock-erp/faturas/:cpf
  // Buscar faturas do cliente por CPF
  static async getFaturasByCpf(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      
      // Remover formatação do CPF
      const cleanCpf = cpf.replace(/[.-]/g, '');
      
      console.log(`[MOCK ERP] Buscando faturas para CPF: ${cpf} (limpo: ${cleanCpf})`);
      
      const faturas = MOCK_INVOICES[cleanCpf as keyof typeof MOCK_INVOICES];
      
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
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar faturas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na consulta de faturas'
      });
    }
  }
  
  // POST /api/mock-erp/clientes/:cpf/contato
  // Atualizar dados de contato do cliente
  static async updateClienteContato(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      const { email, telefone } = req.body;
      
      // Remover formatação do CPF
      const cleanCpf = cpf.replace(/[.-]/g, '');
      
      console.log(`[MOCK ERP] Atualizando contato do cliente CPF: ${cpf}`);
      console.log(`[MOCK ERP] Novos dados - Email: ${email}, Telefone: ${telefone}`);
      
      // Verificar se cliente existe
      const cliente = MOCK_CLIENTS[cleanCpf as keyof typeof MOCK_CLIENTS];
      
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
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao atualizar contato:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na atualização dos dados'
      });
    }
  }
  
  // GET /api/mock-erp/status
  // Status do servidor mock
  static async getStatus(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Servidor Mock ERP funcionando',
      version: '1.0.0',
      clientes_disponiveis: Object.keys(MOCK_CLIENTS).length,
      timestamp: new Date().toISOString()
    });
  }

  // NOVOS MÉTODOS PARA EXPANSÃO DO MODO DEMO

  // GET /api/mock-erp/leitura/:cpf
  // Consultar próxima leitura do medidor
  static async getProximaLeitura(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      
      console.log(`[MOCK ERP] Consultando próxima leitura para CPF: ${cpf}`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      res.status(200).json({
        success: true,
        data: {
          proxima_leitura: "25/09/2025",
          cpf: cpf,
          endereco: "Rua das Flores, 123 - Centro",
          tipo_medidor: "Digital",
          observacoes: "Leitura agendada para o período da manhã"
        }
      });
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao consultar leitura:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na consulta de leitura'
      });
    }
  }

  // GET /api/mock-erp/abastecimento/:cpf
  // Verificar status de abastecimento
  static async getStatusAbastecimento(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      
      console.log(`[MOCK ERP] Verificando status de abastecimento para CPF: ${cpf}`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 700));
      
      res.status(200).json({
        success: true,
        data: {
          status: "Fornecimento de energia normalizado para sua região.",
          cpf: cpf,
          regiao: "Centro - Zona Sul",
          ultima_verificacao: new Date().toISOString(),
          proxima_manutencao: "15/10/2025",
          qualidade_energia: "Excelente"
        }
      });
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao verificar abastecimento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na verificação de abastecimento'
      });
    }
  }

  // GET /api/mock-erp/simulacao-fatura/:cpf
  // Simular valor da próxima fatura
  static async getSimulacaoFatura(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      
      console.log(`[MOCK ERP] Simulando fatura para CPF: ${cpf}`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Gerar valor aleatório baseado no CPF para consistência
      const cleanCpf = cpf.replace(/[.-]/g, '');
      const baseValue = parseInt(cleanCpf.slice(-3)) || 185;
      const simulatedValue = (baseValue + Math.random() * 50).toFixed(2);
      
      res.status(200).json({
        success: true,
        data: {
          valor_simulado: `R$ ${simulatedValue}`,
          periodo: "30 dias",
          cpf: cpf,
          consumo_estimado: `${Math.floor(Math.random() * 200 + 150)} kWh`,
          base_calculo: "Média dos últimos 6 meses",
          vencimento_estimado: "15/10/2025"
        }
      });
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao simular fatura:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na simulação de fatura'
      });
    }
  }

  // GET /api/mock-erp/negociacao/:cpf
  // Buscar proposta de negociação de débitos
  static async getPropostaNegociacao(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;
      const cleanCpf = cpf.replace(/[.-]/g, '');
      
      console.log(`[MOCK ERP] Buscando proposta de negociação para CPF: ${cpf}`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Lógica específica baseada no CPF
      if (cleanCpf === '22222222222') {
        // João Inadimplente - tem débitos para negociar
        res.status(200).json({
          success: true,
          data: {
            proposta_disponivel: true,
            valor_total: "R$ 350,00",
            parcelas: "3x de R$ 116,67",
            desconto: "15% de desconto à vista",
            link_pagamento: "https://pagamento.mock/negociacao123",
            cpf: cpf,
            validade_proposta: "30 dias",
            faturas_incluidas: ["FAT-2024-001", "FAT-2024-002"],
            observacoes: "Proposta especial com condições facilitadas"
          }
        });
      } else if (cleanCpf === '11111111111') {
        // Maria Adimplente - não tem débitos
        res.status(200).json({
          success: true,
          data: {
            proposta_disponivel: false,
            mensagem: "Você não possui débitos para negociar.",
            cpf: cpf,
            status_conta: "Adimplente",
            ultima_verificacao: new Date().toISOString()
          }
        });
      } else {
        // CPF genérico - simular proposta padrão
        res.status(200).json({
          success: true,
          data: {
            proposta_disponivel: true,
            valor_total: "R$ 125,00",
            parcelas: "2x de R$ 62,50",
            desconto: "10% de desconto à vista",
            link_pagamento: "https://pagamento.mock/negociacao456",
            cpf: cpf,
            validade_proposta: "15 dias",
            observacoes: "Proposta baseada no histórico do cliente"
          }
        });
      }
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar negociação:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na consulta de negociação'
      });
    }
  }

  // GET /api/mock-erp/customers
  // Buscar clientes com base em critérios para campanhas
  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { region, city, customerStatus, lastInteraction } = req.query;
      
      console.log(`[MOCK ERP] Buscando clientes com critérios: ${JSON.stringify(req.query)}`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Lista de clientes mock para campanhas
      const mockCustomers = [
        {
          id: '1',
          name: 'Maria Silva',
          phone: '5511999999999',
          email: 'maria@example.com',
          cpf: '111.111.111-11',
          region: 'Sudeste',
          city: 'São Paulo',
          status: 'ACTIVE',
          lastInteraction: '2023-08-15',
        },
        {
          id: '2',
          name: 'João Santos',
          phone: '5511888888888',
          email: 'joao@example.com',
          cpf: '222.222.222-22',
          region: 'Sudeste',
          city: 'Rio de Janeiro',
          status: 'INACTIVE',
          lastInteraction: '2023-05-20',
        },
        {
          id: '3',
          name: 'Ana Oliveira',
          phone: '5511777777777',
          email: 'ana@example.com',
          cpf: '333.333.333-33',
          region: 'Sul',
          city: 'Curitiba',
          status: 'ACTIVE',
          lastInteraction: '2023-09-01',
        },
        {
          id: '4',
          name: 'Carlos Pereira',
          phone: '5511666666666',
          email: 'carlos@example.com',
          cpf: '444.444.444-44',
          region: 'Nordeste',
          city: 'Recife',
          status: 'ACTIVE',
          lastInteraction: '2023-07-10',
        },
        {
          id: '5',
          name: 'Fernanda Lima',
          phone: '5511555555555',
          email: 'fernanda@example.com',
          cpf: '555.555.555-55',
          region: 'Centro-Oeste',
          city: 'Brasília',
          status: 'INACTIVE',
          lastInteraction: '2023-04-05',
        },
      ];
      
      // Filtrar clientes com base nos critérios
      let filteredCustomers = [...mockCustomers];
      
      if (region) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.region.toLowerCase() === (region as string).toLowerCase()
        );
      }
      
      if (city) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.city.toLowerCase() === (city as string).toLowerCase()
        );
      }
      
      if (customerStatus) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.status.toLowerCase() === (customerStatus as string).toLowerCase()
        );
      }
      
      if (lastInteraction) {
        const lastInteractionDate = new Date(lastInteraction as string);
        filteredCustomers = filteredCustomers.filter(customer => 
          new Date(customer.lastInteraction) >= lastInteractionDate
        );
      }
      
      console.log(`[MOCK ERP] Encontrados ${filteredCustomers.length} clientes que atendem aos critérios`);
      
      res.status(200).json(filteredCustomers);
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar clientes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na busca de clientes'
      });
    }
  }

  // GET /api/mock-erp/regions
  // Buscar regiões disponíveis para segmentação
  static async getRegions(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MOCK ERP] Buscando regiões disponíveis para segmentação`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Lista de regiões disponíveis
      const regions = [
        'Sudeste',
        'Sul',
        'Nordeste',
        'Norte',
        'Centro-Oeste'
      ];
      
      res.status(200).json(regions);
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar regiões:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na busca de regiões'
      });
    }
  }

  // GET /api/mock-erp/cities
  // Buscar cidades disponíveis para segmentação
  static async getCities(req: Request, res: Response): Promise<void> {
    try {
      const { region } = req.query;
      
      console.log(`[MOCK ERP] Buscando cidades disponíveis para segmentação${region ? ` na região ${region}` : ''}`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mapa de cidades por região
      const citiesByRegion: Record<string, string[]> = {
        'sudeste': ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Vitória'],
        'sul': ['Curitiba', 'Florianópolis', 'Porto Alegre', 'Joinville'],
        'nordeste': ['Recife', 'Salvador', 'Fortaleza', 'Natal', 'João Pessoa'],
        'norte': ['Manaus', 'Belém', 'Palmas', 'Rio Branco'],
        'centro-oeste': ['Brasília', 'Goiânia', 'Cuiabá', 'Campo Grande']
      };
      
      // Se uma região foi especificada, retornar apenas as cidades dessa região
      if (region) {
        const regionKey = (region as string).toLowerCase();
        const cities = citiesByRegion[regionKey] || [];
        res.status(200).json(cities);
      } else {
        // Caso contrário, retornar todas as cidades
        const allCities = Object.values(citiesByRegion).flat();
        res.status(200).json(allCities);
      }
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar cidades:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na busca de cidades'
      });
    }
  }

  // GET /api/mock-erp/customer-statuses
  // Buscar status de cliente disponíveis para segmentação
  static async getCustomerStatuses(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MOCK ERP] Buscando status de cliente disponíveis para segmentação`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const customerStatuses = [
        'ACTIVE',
        'INACTIVE',
        'NEW',
        'VIP',
        'DEFAULTER'
      ];
      
      res.status(200).json(customerStatuses);
      
    } catch (error) {
      console.error('[MOCK ERP] Erro ao buscar status de cliente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor mock',
        message: 'Falha na busca de status de cliente'
      });
    }
  }
}


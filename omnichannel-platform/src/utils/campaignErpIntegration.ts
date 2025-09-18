import axios from 'axios';
import { logger } from './logger';

// Interface para critérios de segmentação
export interface TargetCriteria {
  region?: string;
  city?: string;
  customerStatus?: string;
  lastInteraction?: string;
  [key: string]: any;
}

// Interface para cliente
export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  region?: string;
  city?: string;
  status?: string;
  lastInteraction?: Date;
  [key: string]: any;
}

/**
 * Busca clientes no ERP com base nos critérios de segmentação
 */
export const fetchTargetCustomers = async (criteria: TargetCriteria): Promise<Customer[]> => {
  try {
    logger.info(`Fetching target customers with criteria: ${JSON.stringify(criteria)}`);
    
    // Em ambiente de produção, isso seria uma chamada real para a API do ERP
    // Para o ambiente de demonstração, usamos a API mock
    const baseUrl = process.env.ERP_API_URL || 'http://localhost:3000/api/mock-erp';
    
    // Construir parâmetros de consulta
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    // Fazer chamada para a API
    const response = await axios.get(`${baseUrl}/customers`, { params });
    
    if (response.status !== 200) {
      throw new Error(`ERP API returned status ${response.status}`);
    }
    
    const customers = response.data;
    logger.info(`Found ${customers.length} customers matching criteria`);
    
    return customers;
  } catch (error) {
    logger.error(`Error fetching target customers: ${error}`);
    
    // Em caso de erro na API real, usamos dados mock para demonstração
    return getMockCustomers(criteria);
  }
};

/**
 * Gera clientes mock para demonstração
 */
const getMockCustomers = (criteria: TargetCriteria): Customer[] => {
  logger.info('Using mock customers for demonstration');
  
  // Lista de clientes mock
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Maria Silva',
      phone: '5511999999999',
      email: 'maria@example.com',
      cpf: '111.111.111-11',
      region: 'Sudeste',
      city: 'São Paulo',
      status: 'ACTIVE',
      lastInteraction: new Date('2023-08-15'),
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
      lastInteraction: new Date('2023-05-20'),
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
      lastInteraction: new Date('2023-09-01'),
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
      lastInteraction: new Date('2023-07-10'),
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
      lastInteraction: new Date('2023-04-05'),
    },
  ];
  
  // Filtrar clientes com base nos critérios
  return mockCustomers.filter(customer => {
    let match = true;
    
    if (criteria.region && customer.region !== criteria.region) {
      match = false;
    }
    
    if (criteria.city && customer.city !== criteria.city) {
      match = false;
    }
    
    if (criteria.customerStatus && customer.status !== criteria.customerStatus) {
      match = false;
    }
    
    if (criteria.lastInteraction) {
      const lastInteractionDate = new Date(criteria.lastInteraction);
      if (customer.lastInteraction && customer.lastInteraction < lastInteractionDate) {
        match = false;
      }
    }
    
    return match;
  });
};


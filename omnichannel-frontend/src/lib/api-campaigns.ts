import { api } from './api';

// Tipos para Campaigns
export interface Campaign {
  id: string;
  name: string;
  message_template_id: string;
  target_criteria: any;
  template_variables: any;
  scheduled_at?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignRequest {
  name: string;
  message_template_id: string;
  target_criteria: any;
  template_variables: any;
  scheduled_at?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED';
}

export interface UpdateCampaignRequest {
  name?: string;
  message_template_id?: string;
  target_criteria?: any;
  template_variables?: any;
  scheduled_at?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED';
}

// API para Campaigns
export const campaignsAPI = {
  // Listar todas as campanhas
  getAll: async () => {
    const response = await api.get('/api/campaigns');
    return response.data;
  },

  // Listar campanhas por status
  getByStatus: async (status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED') => {
    const response = await api.get(`/api/campaigns/status/${status}`);
    return response.data;
  },

  // Listar campanhas agendadas para um período
  getScheduledBetween: async (startDate: string, endDate: string) => {
    const response = await api.get(`/api/campaigns/scheduled?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Buscar campanha por ID
  getById: async (id: string) => {
    const response = await api.get(`/api/campaigns/${id}`);
    return response.data;
  },

  // Criar nova campanha
  create: async (campaignData: CreateCampaignRequest) => {
    const response = await api.post('/api/campaigns', campaignData);
    return response.data;
  },

  // Atualizar campanha
  update: async (id: string, campaignData: UpdateCampaignRequest) => {
    const response = await api.put(`/api/campaigns/${id}`, campaignData);
    return response.data;
  },

  // Atualizar status da campanha
  updateStatus: async (id: string, status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED') => {
    const response = await api.patch(`/api/campaigns/${id}/status`, { status });
    return response.data;
  },

  // Deletar campanha
  delete: async (id: string) => {
    const response = await api.delete(`/api/campaigns/${id}`);
    return response.data;
  },

  // Buscar regiões disponíveis para segmentação
  getAvailableRegions: async () => {
    const response = await api.get('/api/mock-erp/regions');
    return response.data;
  },

  // Buscar cidades disponíveis para segmentação
  getAvailableCities: async (region?: string) => {
    const params = region ? { region } : {};
    const response = await api.get('/api/mock-erp/cities', { params });
    return response.data;
  },

  // Buscar status de cliente disponíveis para segmentação
  getAvailableCustomerStatuses: async () => {
    const response = await api.get('/api/mock-erp/customer-statuses');
    return response.data;
  },

  // Simular envio de campanha (para testes)
  simulateSend: async (id: string) => {
    const response = await api.post(`/api/campaigns/${id}/simulate`);
    return response.data;
  }
};


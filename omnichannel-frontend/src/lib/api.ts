import axios from 'axios';

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos para as respostas da API
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'ADMIN' | 'AGENT';
  is_two_factor_enabled: boolean;
  created_at: string;
}

export interface LoginResponse {
  message: string;
  requiresSetup2FA?: boolean;
  requires2FA?: boolean;
  temporaryToken?: string;
  userId?: string;
  token?: string;
  expiresIn?: string;
  user?: User;
}

export interface Generate2FAResponse {
  message: string;
  qrCode: string;
  secret: string;
  authURL: string;
}

export interface Activate2FAResponse {
  message: string;
  token: string;
  expiresIn: string;
  user: User;
}

export interface Verify2FAResponse {
  message: string;
  token: string;
  expiresIn: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}

// Funções da API de autenticação
export const authAPI = {
  // Login com email e senha
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  // Gerar configuração 2FA
  generate2FA: async (): Promise<Generate2FAResponse> => {
    const response = await api.post('/api/auth/2fa/generate');
    return response.data;
  },

  // Ativar 2FA
  activate2FA: async (token: string): Promise<Activate2FAResponse> => {
    const response = await api.post('/api/auth/2fa/activate', { token });
    return response.data;
  },

  // Verificar 2FA
  verify2FA: async (email: string, password: string, token: string): Promise<Verify2FAResponse> => {
    const response = await api.post('/api/auth/2fa/verify', { email, password, token });
    return response.data;
  },

  // Obter usuário atual
  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Renovar token
  refreshToken: async (): Promise<Activate2FAResponse> => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

// Tipos para gerenciamento de usuários
export interface CreateUserRequest {
  fullName: string;
  email: string;
  role?: 'AGENT' | 'SUPERVISOR';
  team_id?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
}

export interface CreateUserResponse {
  message: string;
  user: User;
  provisionalPassword: string;
}

export interface ListUsersResponse {
  message: string;
  users: User[];
  total: number;
}

export interface UserStatsResponse {
  message: string;
  stats: { role: string; count: number }[];
}

export interface ResetPasswordResponse {
  message: string;
  newPassword: string;
  note: string;
}

// Funções da API de usuários
export const usersAPI = {
  // Listar todos os atendentes
  listAgents: async (): Promise<ListUsersResponse> => {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Buscar usuário por ID
  getUserById: async (id: string): Promise<{ message: string; user: User }> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Criar novo atendente
  createAgent: async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Atualizar usuário
  updateUser: async (id: string, userData: UpdateUserRequest): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Excluir usuário
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  // Redefinir senha
  resetPassword: async (id: string): Promise<ResetPasswordResponse> => {
    const response = await api.post(`/api/users/${id}/reset-password`);
    return response.data;
  },

  // Obter estatísticas
  getStats: async (): Promise<UserStatsResponse> => {
    const response = await api.get('/api/users/stats');
    return response.data;
  },

  // Verificar setup inicial
  checkInitialSetup: async (): Promise<{ needsInitialSetup: boolean; userCount: number }> => {
    const response = await api.get('/api/users/check-initial');
    return response.data;
  },

  // Criar usuário inicial
  createInitialUser: async (userData: {
    email: string;
    password: string;
    full_name?: string;
    role?: string;
  }): Promise<{ message: string; user: User }> => {
    const response = await api.post('/api/users/create-initial', userData);
    return response.data;
  },
};

// Tipos para configurações
export interface Settings {
  webchat_snippet_id: string | null;
  whatsapp_api_key: string;
  whatsapp_endpoint_url: string;
  erp_api_base_url: string;
  erp_api_auth_token: string;
  erp_connection_status: 'not_verified' | 'connected' | 'failed';
}

export interface UpdateSettingsRequest {
  whatsappApiKey?: string;
  whatsappEndpointUrl?: string;
  erpApiBaseUrl?: string;
  erpApiAuthToken?: string;
}

export interface TestConnectionRequest {
  erpApiBaseUrl: string;
  erpApiAuthToken: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  details?: string;
}

export interface WebchatSnippetResponse {
  message: string;
  snippet: string;
  snippetId: string;
}

// Funções da API de configurações
export const settingsAPI = {
  // Obter configurações
  getSettings: async (): Promise<{ message: string; settings: Settings }> => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  // Atualizar configurações
  updateSettings: async (settingsData: UpdateSettingsRequest): Promise<{ message: string; settings: Settings }> => {
    const response = await api.put('/api/settings', settingsData);
    return response.data;
  },

  // Testar conexão com ERP
  testConnection: async (connectionData: TestConnectionRequest): Promise<TestConnectionResponse> => {
    const response = await api.post('/api/settings/test-connection', connectionData);
    return response.data;
  },

  // Obter snippet do webchat
  getWebchatSnippet: async (): Promise<WebchatSnippetResponse> => {
    const response = await api.get('/api/settings/webchat-snippet');
    return response.data;
  },

  // Regenerar snippet do webchat
  regenerateSnippet: async (): Promise<{ message: string; snippetId: string }> => {
    const response = await api.post('/api/settings/regenerate-snippet');
    return response.data;
  },
};

// Tipos para fluxos de chatbot
export interface ChatbotFlow {
  id: string;
  name: string;
  description?: string;
  flow_definition: object;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFlowRequest {
  name: string;
  description?: string;
  flow_definition?: object;
}

export interface UpdateFlowRequest {
  name?: string;
  description?: string;
  flow_definition?: object;
  is_active?: boolean;
}

export interface FlowStats {
  total: number;
  active: number;
  inactive: number;
  withDefinition: number;
  empty: number;
}

// Funções da API de fluxos
export const flowsAPI = {
  // Listar todos os fluxos
  getFlows: async (): Promise<{ message: string; flows: ChatbotFlow[]; total: number }> => {
    const response = await api.get('/api/flows');
    return response.data;
  },

  // Obter fluxo por ID
  getFlowById: async (id: string): Promise<{ message: string; flow: ChatbotFlow }> => {
    const response = await api.get(`/api/flows/${id}`);
    return response.data;
  },

  // Criar novo fluxo
  createFlow: async (flowData: CreateFlowRequest): Promise<{ message: string; flow: ChatbotFlow }> => {
    const response = await api.post('/api/flows', flowData);
    return response.data;
  },

  // Atualizar fluxo
  updateFlow: async (id: string, flowData: UpdateFlowRequest): Promise<{ message: string; flow: ChatbotFlow }> => {
    const response = await api.put(`/api/flows/${id}`, flowData);
    return response.data;
  },

  // Excluir fluxo
  deleteFlow: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/flows/${id}`);
    return response.data;
  },

  // Publicar fluxo
  publishFlow: async (id: string): Promise<{ message: string; flow: ChatbotFlow }> => {
    const response = await api.post(`/api/flows/${id}/publish`);
    return response.data;
  },

  // Despublicar fluxo
  unpublishFlow: async (id: string): Promise<{ message: string; flow: ChatbotFlow }> => {
    const response = await api.post(`/api/flows/${id}/unpublish`);
    return response.data;
  },

  // Obter fluxo ativo
  getActiveFlow: async (): Promise<{ message: string; flow: ChatbotFlow }> => {
    const response = await api.get('/api/flows/active');
    return response.data;
  },

  // Obter estatísticas
  getFlowStats: async (): Promise<{ message: string; stats: FlowStats }> => {
    const response = await api.get('/api/flows/stats');
    return response.data;
  },
};

// Funções utilitárias para gerenciar autenticação
export const authUtils = {
  // Salvar token e dados do usuário
  saveAuth: (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
  },

  // Obter token salvo
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  // Obter dados do usuário salvos
  getUser: (): User | null => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  // Verificar se está autenticado
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  // Limpar dados de autenticação
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  // Verificar se é admin
  isAdmin: (): boolean => {
    const user = authUtils.getUser();
    return user?.role === 'ADMIN';
  },

  // Verificar se é agent
  isAgent: (): boolean => {
    const user = authUtils.getUser();
    return user?.role === 'AGENT';
  },
};


// Tipos para o webchat
export interface WebchatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
  buttons?: string[];
}

export interface BotResponse {
  type: 'message' | 'menu' | 'input_request' | 'transfer' | 'error';
  content: string;
  buttons?: string[];
  next_node_id?: string;
  requires_input?: boolean;
  input_type?: 'text' | 'cpf' | 'email' | 'phone';
  transfer_queue?: string;
  conversation_id?: string;
}

// Função auxiliar para obter token
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// API de conversas
export const conversationsAPI = {
  baseUrl: 'https://3000-ibpo3howxfmwxhvuhwe06-e61bfc4f.manusvm.computer',

  setBaseUrl(url: string) {
    this.baseUrl = url;
  },

  async startConversation(data?: {
    customer_identifier?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/api/conversations/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      throw new Error('Erro ao iniciar conversa');
    }

    return response.json();
  },

  async sendMessage(conversationId: string, data: {
    content: string;
    message_type?: 'TEXT' | 'BUTTON';
    button_index?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    return response.json();
  },

  async getMessages(conversationId: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/messages?${queryParams}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erro ao obter mensagens');
    }

    return response.json();
  },

  async getConversations(params?: {
    status?: string;
    queue?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.queue) queryParams.append('queue', params.queue);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/conversations?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao obter conversas');
    }

    return response.json();
  },

  async assignConversation(conversationId: string, data?: {
    assignee_id?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/assign`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      throw new Error('Erro ao atribuir conversa');
    }

    return response.json();
  },

  async closeConversation(conversationId: string, data?: {
    reason?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/close`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      throw new Error('Erro ao fechar conversa');
    }

    return response.json();
  },

  async getConversationStats() {
    const response = await fetch(`${this.baseUrl}/api/conversations/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao obter estatísticas');
    }

    return response.json();
  },
};


// API de clientes
export const customersAPI = {
  async getCustomerByConversation(conversationId: string) {
    const response = await fetch(`${API_BASE_URL}/api/customers/conversation/${conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao obter dados do cliente');
    }

    return response.json();
  },

  async searchCustomer(document: string) {
    const response = await fetch(`${API_BASE_URL}/api/customers/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document }),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar cliente');
    }

    return response.json();
  },

  async getCustomerInvoices(identifier: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_BASE_URL}/api/customers/${identifier}/invoices?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao obter faturas do cliente');
    }

    return response.json();
  },

  async getCustomerHistory(identifier: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_BASE_URL}/api/customers/${identifier}/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao obter histórico do cliente');
    }

    return response.json();
  },
};
// API para Relatórios
export const reportsAPI = {
  // Obter resumo de relatórios
  getSummary: async (period: string = 'last7days') => {
    const response = await api.get(`/api/reports/summary?period=${period}`);
    return response.data;
  },

  // Obter relatório detalhado
  getDetailed: async (period: string = 'last7days') => {
    const response = await api.get(`/api/reports/detailed?period=${period}`);
    return response.data;
  },

  // Exportar dados
  exportData: async (period: string = 'last7days', format: string = 'json') => {
    const response = await api.get(`/api/reports/export?period=${period}&format=${format}`);
    return response.data;
  },

  // Obter relatórios de performance (TMA e TMR)
  getPerformance: async (period: string = 'last30days', teamId?: string) => {
    const params = new URLSearchParams({ period });
    if (teamId) {
      params.append('team_id', teamId);
    }
    const response = await api.get(`/api/reports/performance?${params.toString()}`);
    return response.data;
  }
};
// API para Teams
export const teamsAPI = {
  // Listar todas as equipes
  getAll: async () => {
    const response = await api.get('/api/teams');
    return response.data;
  },

  // Buscar equipe por ID
  getById: async (id: string) => {
    const response = await api.get(`/api/teams/${id}`);
    return response.data;
  },

  // Criar nova equipe
  create: async (teamData: { name: string }) => {
    const response = await api.post('/api/teams', teamData);
    return response.data;
  },

  // Atualizar equipe
  update: async (id: string, teamData: { name: string }) => {
    const response = await api.put(`/api/teams/${id}`, teamData);
    return response.data;
  },

  // Deletar equipe
  delete: async (id: string) => {
    const response = await api.delete(`/api/teams/${id}`);
    return response.data;
  }
};

// API para System Messages
export const systemMessagesAPI = {
  // Listar todas as mensagens do sistema
  getAll: async () => {
    const response = await api.get('/api/system-messages');
    return response.data;
  },

  // Buscar mensagem por chave
  getByKey: async (key: string) => {
    const response = await api.get(`/api/system-messages/${key}`);
    return response.data;
  },

  // Atualizar mensagem
  updateByKey: async (key: string, content: string) => {
    const response = await api.put(`/api/system-messages/${key}`, { content });
    return response.data;
  },

  // Criar nova mensagem
  create: async (messageData: { message_key: string; content: string; description?: string }) => {
    const response = await api.post('/api/system-messages', messageData);
    return response.data;
  },

  // Deletar mensagem
  deleteByKey: async (key: string) => {
    const response = await api.delete(`/api/system-messages/${key}`);
    return response.data;
  }
};

// Tipos para Message Templates
export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  whatsapp_template_id?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface CreateMessageTemplateRequest {
  name: string;
  body: string;
  whatsapp_template_id?: string;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface UpdateMessageTemplateRequest {
  name?: string;
  body?: string;
  whatsapp_template_id?: string;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

// API para Message Templates
export const messageTemplatesAPI = {
  // Listar todos os templates
  getAll: async () => {
    const response = await api.get('/api/message-templates');
    return response.data;
  },

  // Listar templates por status
  getByStatus: async (status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') => {
    const response = await api.get(`/api/message-templates/status/${status}`);
    return response.data;
  },

  // Buscar template por ID
  getById: async (id: string) => {
    const response = await api.get(`/api/message-templates/${id}`);
    return response.data;
  },

  // Criar novo template
  create: async (templateData: CreateMessageTemplateRequest) => {
    const response = await api.post('/api/message-templates', templateData);
    return response.data;
  },

  // Atualizar template
  update: async (id: string, templateData: UpdateMessageTemplateRequest) => {
    const response = await api.put(`/api/message-templates/${id}`, templateData);
    return response.data;
  },

  // Atualizar status do template
  updateStatus: async (id: string, status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') => {
    const response = await api.patch(`/api/message-templates/${id}/status`, { status });
    return response.data;
  },

  // Deletar template
  delete: async (id: string) => {
    const response = await api.delete(`/api/message-templates/${id}`);
    return response.data;
  }
};


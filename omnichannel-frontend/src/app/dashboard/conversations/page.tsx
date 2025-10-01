'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { conversationsAPI } from '@/lib/api';

interface Conversation {
  id: string;
  customer_identifier?: string;
  status: 'BOT' | 'QUEUED' | 'OPEN' | 'CLOSED';
  queue?: string;
  assignee_id?: string;
  created_at: string;
  last_message?: {
    id: string;
    content: string;
    sender_type: 'BOT' | 'CUSTOMER' | 'AGENT';
    created_at: string;
  };
}

interface ConversationStats {
  total: number;
  bot: number;
  queued: number;
  open: number;
  closed: number;
}

const ConversationsPage: React.FC = () => {
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    bot: 0,
    queued: 0,
    open: 0,
    closed: 0
  });
  const [queueFilter, setQueueFilter] = useState<string>('');

  useEffect(() => {
    loadConversations();
    loadStats();
  }, [statusFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (queueFilter) params.queue = queueFilter;
      
      const response = await conversationsAPI.getConversations(params);
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await conversationsAPI.getConversationStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAssignConversation = async (conversationId: string) => {
    try {
      await conversationsAPI.assignConversation(conversationId);
      loadConversations();
      alert('Conversa atribuída com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir conversa:', error);
      alert('Erro ao atribuir conversa');
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    const reason = prompt('Motivo do encerramento (opcional):');
    try {
      await conversationsAPI.closeConversation(conversationId, { reason: reason || undefined });
      loadConversations();
      alert('Conversa encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar conversa:', error);
      alert('Erro ao encerrar conversa');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOT':
        return 'bg-blue-100 text-blue-800';
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BOT':
        return <MessageSquare className="h-4 w-4" />;
      case 'QUEUED':
        return <Clock className="h-4 w-4" />;
      case 'OPEN':
        return <User className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Filtrar conversas baseado no termo de busca
  const displayConversations = conversations.filter(conversation =>
    conversation.customer_identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.last_message?.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversas</h1>
          <p className="text-gray-600">Gerencie todas as conversas dos clientes</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bot</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.bot}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Na Fila</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.queued}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Abertas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.open}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fechadas</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Buscar por cliente ou mensagem..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="BOT">Bot</option>
                <option value="QUEUED">Na Fila</option>
                <option value="OPEN">Abertas</option>
                <option value="CLOSED">Fechadas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fila
              </label>
              <select
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todas as filas</option>
                <option value="financeiro">Financeiro</option>
                <option value="suporte">Suporte Técnico</option>
                <option value="vendas">Vendas</option>
                <option value="geral">Atendimento Geral</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadConversations}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Filter className="h-4 w-4 inline mr-2" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Conversas ({displayConversations.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando conversas...</p>
            </div>
          ) : displayConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedConversation === conversation.id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(
                    selectedConversation === conversation.id ? null : conversation.id
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.customer_identifier || 'Cliente Anônimo'}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                            {getStatusIcon(conversation.status)}
                            <span className="ml-1">{conversation.status}</span>
                          </span>
                          {conversation.queue && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {conversation.queue}
                            </span>
                          )}
                        </div>
                        
                        {conversation.last_message && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            <span className="font-medium">
                              {conversation.last_message.sender_type === 'BOT' ? 'Bot' : 
                               conversation.last_message.sender_type === 'CUSTOMER' ? 'Cliente' : 'Atendente'}:
                            </span>
                            {' '}{conversation.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>

                      {conversation.status === 'QUEUED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignConversation(conversation.id);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          Assumir
                        </button>
                      )}

                      {(conversation.status === 'OPEN' || conversation.status === 'BOT') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseConversation(conversation.id);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          Encerrar
                        </button>
                      )}

                      <ArrowRight className={`h-4 w-4 text-gray-400 transition-transform ${
                        selectedConversation === conversation.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedConversation === conversation.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">ID da Conversa</p>
                          <p className="text-gray-600 font-mono">{conversation.id}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-700">Criada em</p>
                          <p className="text-gray-600">
                            {new Date(conversation.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        {conversation.assignee_id && (
                          <div>
                            <p className="font-medium text-gray-700">Atendente</p>
                            <p className="text-gray-600">{conversation.assignee_id}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => window.open(`/dashboard/conversations/${conversation.id}`, '_blank')}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                        >
                          Ver Conversa Completa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;


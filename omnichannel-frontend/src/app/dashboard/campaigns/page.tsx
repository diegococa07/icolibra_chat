'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos
interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED';
  scheduled_at: string | null;
  created_at: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Carregar campanhas
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/campaigns';
      if (activeFilter !== 'all') {
        url = `/api/campaigns/status/${activeFilter}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setCampaigns(response.data.data);
      } else {
        setError('Erro ao carregar campanhas');
      }
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err);
      setError('Erro ao carregar campanhas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar campanhas ao montar o componente
  useEffect(() => {
    loadCampaigns();
  }, [activeFilter]);

  // Excluir campanha
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/api/campaigns/${id}`);
      
      if (response.data.success) {
        // Recarregar campanhas após exclusão
        loadCampaigns();
      } else {
        setError('Erro ao excluir campanha');
      }
    } catch (err) {
      console.error('Erro ao excluir campanha:', err);
      setError('Erro ao excluir campanha. Tente novamente mais tarde.');
    }
  };

  // Formatar data relativa
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Não agendada';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (err) {
      return 'Data inválida';
    }
  };

  // Obter classe de cor com base no status
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-200 text-gray-800';
      case 'SCHEDULED':
        return 'bg-blue-200 text-blue-800';
      case 'SENDING':
        return 'bg-yellow-200 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Traduzir status
  const translateStatus = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Rascunho';
      case 'SCHEDULED':
        return 'Agendada';
      case 'SENDING':
        return 'Enviando';
      case 'COMPLETED':
        return 'Concluída';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campanhas</h1>
        <button
          onClick={() => router.push('/dashboard/campaigns/new')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Nova Campanha
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-md ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('DRAFT')}
            className={`px-4 py-2 rounded-md ${
              activeFilter === 'DRAFT'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Rascunhos
          </button>
          <button
            onClick={() => setActiveFilter('SCHEDULED')}
            className={`px-4 py-2 rounded-md ${
              activeFilter === 'SCHEDULED'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Agendadas
          </button>
          <button
            onClick={() => setActiveFilter('SENDING')}
            className={`px-4 py-2 rounded-md ${
              activeFilter === 'SENDING'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Em Envio
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-4 py-2 rounded-md ${
              activeFilter === 'COMPLETED'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Lista de campanhas */}
      {!loading && campaigns.length === 0 && (
        <div className="bg-gray-100 p-8 rounded-md text-center">
          <p className="text-gray-600">Nenhuma campanha encontrada.</p>
          <button
            onClick={() => router.push('/dashboard/campaigns/new')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Criar Nova Campanha
          </button>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agendamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criada em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                        campaign.status
                      )}`}
                    >
                      {translateStatus(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      {formatRelativeDate(campaign.scheduled_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        disabled={campaign.status === 'SENDING' || campaign.status === 'COMPLETED'}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={campaign.status === 'SENDING' || campaign.status === 'COMPLETED'}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


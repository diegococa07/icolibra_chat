'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageTemplate, 
  messageTemplatesAPI, 
  authUtils,
  CreateMessageTemplateRequest,
  UpdateMessageTemplateRequest
} from '@/lib/api';
import { 
  MessageSquare, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  FileText,
  Send
} from 'lucide-react';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState<CreateMessageTemplateRequest>({
    name: '',
    body: '',
    whatsapp_template_id: '',
    status: 'DRAFT'
  });
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all');

  // Verificar se é admin
  const isAdmin = authUtils.isAuthenticated() && authUtils.isAdmin();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    loadTemplates();
  }, [isAdmin, router]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await messageTemplatesAPI.getAll();
      setTemplates(response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar templates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatesByStatus = async (status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') => {
    try {
      setLoading(true);
      const response = await messageTemplatesAPI.getByStatus(status);
      setTemplates(response.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao carregar templates com status ${status}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'draft' | 'pending' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    
    if (tab === 'all') {
      loadTemplates();
    } else if (tab === 'draft') {
      loadTemplatesByStatus('DRAFT');
    } else if (tab === 'pending') {
      loadTemplatesByStatus('PENDING_APPROVAL');
    } else if (tab === 'approved') {
      loadTemplatesByStatus('APPROVED');
    } else if (tab === 'rejected') {
      loadTemplatesByStatus('REJECTED');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setError('');
      
      if (!formData.name || !formData.body) {
        setError('Nome e corpo do template são obrigatórios');
        return;
      }
      
      if (editingTemplate) {
        // Atualizar template existente
        const updateData: UpdateMessageTemplateRequest = {
          name: formData.name,
          body: formData.body,
          whatsapp_template_id: formData.whatsapp_template_id,
          status: formData.status
        };
        
        await messageTemplatesAPI.update(editingTemplate.id, updateData);
        setSuccess('Template atualizado com sucesso!');
      } else {
        // Criar novo template
        await messageTemplatesAPI.create(formData);
        setSuccess('Template criado com sucesso!');
      }
      
      // Resetar formulário e fechar modal
      setFormData({
        name: '',
        body: '',
        whatsapp_template_id: '',
        status: 'DRAFT'
      });
      setEditingTemplate(null);
      setShowModal(false);
      
      // Recarregar templates
      loadTemplates();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar template';
      setError(errorMessage);
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      body: template.body,
      whatsapp_template_id: template.whatsapp_template_id || '',
      status: template.status
    });
    setShowModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return;
    }
    
    try {
      await messageTemplatesAPI.delete(id);
      setSuccess('Template excluído com sucesso!');
      
      // Recarregar templates
      loadTemplates();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir template';
      setError(errorMessage);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') => {
    try {
      await messageTemplatesAPI.updateStatus(id, status);
      setSuccess(`Status do template atualizado para ${status}!`);
      
      // Recarregar templates
      loadTemplates();
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status do template';
      setError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Rascunho</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Aguardando Aprovação</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Aprovado</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejeitado</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'PENDING_APPROVAL':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading && templates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar para Configurações</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Templates de Mensagem
                </h1>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setFormData({
                  name: '',
                  body: '',
                  whatsapp_template_id: '',
                  status: 'DRAFT'
                });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Template</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => handleTabChange('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleTabChange('draft')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'draft'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rascunhos
              </button>
              <button
                onClick={() => handleTabChange('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aguardando Aprovação
              </button>
              <button
                onClick={() => handleTabChange('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'approved'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aprovados
              </button>
              <button
                onClick={() => handleTabChange('rejected')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'rejected'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rejeitados
              </button>
            </nav>
          </div>

          {/* Templates List */}
          <div className="p-6">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'all' 
                    ? 'Você ainda não criou nenhum template de mensagem.' 
                    : `Não há templates com status "${activeTab.toUpperCase()}".`}
                </p>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setFormData({
                      name: '',
                      body: '',
                      whatsapp_template_id: '',
                      status: 'DRAFT'
                    });
                    setShowModal(true);
                  }}
                  className="inline-flex items-center space-x-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Primeiro Template</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conteúdo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID WhatsApp
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{template.body}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{template.whatsapp_template_id || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(template.status)}
                            {getStatusBadge(template.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(template.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {template.status === 'DRAFT' && (
                              <button
                                onClick={() => handleUpdateStatus(template.id, 'PENDING_APPROVAL')}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Enviar para aprovação"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {template.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(template.id, 'APPROVED')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Aprovar"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(template.id, 'REJECTED')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Rejeitar"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditTemplate(template)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>

        {/* Informações sobre Templates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            ℹ️ Sobre Templates de Mensagem (HSM)
          </h3>
          <div className="text-sm text-blue-800 space-y-4">
            <p>
              Templates de mensagem (HSM - Highly Structured Messages) são modelos pré-aprovados pela Meta (Facebook) 
              que permitem enviar mensagens proativas para clientes via WhatsApp Business API.
            </p>
            <p>
              <strong>Fluxo de aprovação:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Crie um template com o texto desejado (status: Rascunho)</li>
              <li>Envie para aprovação (status: Aguardando Aprovação)</li>
              <li>Submeta o template para a Meta através do Business Manager</li>
              <li>Após aprovação pela Meta, atualize o status para Aprovado e adicione o ID do template</li>
            </ol>
            <p>
              <strong>Regras para variáveis:</strong> Use {{'{{'}}1{{'}}'}}, {{'{{'}}2{{'}}'}}, etc. para marcar onde os valores dinâmicos serão inseridos.
            </p>
            <p>
              <strong>Exemplo:</strong> "Olá, {{'{{'}}1{{'}}'}}. Sua fatura no valor de R$ {{'{{'}}2{{'}}'}} vence em {{'{{'}}3{{'}}'}}."
            </p>
          </div>
        </div>
      </main>

      {/* Modal para criar/editar template */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Template *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Aviso de Vencimento"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                    Corpo do Template *
                  </label>
                  <textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={5}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Olá, {{1}}. Sua fatura no valor de R$ {{2}} vence em {{3}}."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use {{'{{'}}1{{'}}'}}, {{'{{'}}2{{'}}'}}, etc. para marcar variáveis.
                  </p>
                </div>
                <div>
                  <label htmlFor="whatsapp_template_id" className="block text-sm font-medium text-gray-700 mb-1">
                    ID do Template no WhatsApp
                  </label>
                  <input
                    id="whatsapp_template_id"
                    type="text"
                    value={formData.whatsapp_template_id}
                    onChange={(e) => setFormData({ ...formData, whatsapp_template_id: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ID fornecido pela Meta após aprovação"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="PENDING_APPROVAL">Aguardando Aprovação</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="REJECTED">Rejeitado</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
              >
                {editingTemplate ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


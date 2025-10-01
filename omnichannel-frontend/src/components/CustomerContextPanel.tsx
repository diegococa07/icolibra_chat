'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Search,
  Loader2,
  FileText,
  Clock,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { customersAPI } from '@/lib/api';

interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEFAULTER';
  address?: {
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
  };
  lastInvoice?: {
    id: string;
    amount: number;
    dueDate: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
  };
  totalDebt?: number;
  registrationDate: string;
}

interface CustomerContextPanelProps {
  conversationId: string;
}

const CustomerContextPanel: React.FC<CustomerContextPanelProps> = ({ conversationId }) => {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresManualSearch, setRequiresManualSearch] = useState(false);
  const [manualSearchDocument, setManualSearchDocument] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadCustomerData();
    }
  }, [conversationId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customersAPI.getCustomerByConversation(conversationId);
      
      if (response.customer) {
        setCustomer(response.customer);
        setRequiresManualSearch(false);
      } else {
        setCustomer(null);
        setRequiresManualSearch(response.requiresManualSearch || false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      setError('Erro ao carregar dados do cliente');
      setRequiresManualSearch(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchDocument.trim()) return;

    try {
      setManualSearchLoading(true);
      setError(null);
      
      const response = await customersAPI.searchCustomer(manualSearchDocument);
      setCustomer(response.customer);
      setRequiresManualSearch(false);
      setManualSearchDocument('');
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      setError('Cliente não encontrado ou erro na busca');
    } finally {
      setManualSearchLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'INACTIVE':
        return 'text-gray-600 bg-gray-100';
      case 'DEFAULTER':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4" />;
      case 'DEFAULTER':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'INACTIVE':
        return 'Inativo';
      case 'DEFAULTER':
        return 'Inadimplente';
      default:
        return 'Desconhecido';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'OVERDUE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getInvoiceStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Paga';
      case 'PENDING':
        return 'Pendente';
      case 'OVERDUE':
        return 'Vencida';
      default:
        return 'Desconhecido';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDocument = (document: string) => {
    if (document.length === 11) {
      // CPF
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (document.length === 14) {
      // CNPJ
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return document;
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Carregando dados do cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Contexto do Cliente
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Manual Search */}
        {requiresManualSearch && !customer && (
          <div className="p-4 border-b border-gray-200">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Cliente não identificado automaticamente. Busque manualmente:
              </p>
              <form onSubmit={handleManualSearch} className="space-y-3">
                <input
                  type="text"
                  value={manualSearchDocument}
                  onChange={(e) => setManualSearchDocument(e.target.value)}
                  placeholder="Digite CPF ou CNPJ"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={manualSearchLoading}
                />
                <button
                  type="submit"
                  disabled={manualSearchLoading || !manualSearchDocument.trim()}
                  className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                >
                  {manualSearchLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Buscar Cliente
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Data */}
        {customer && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{customer.name}</h4>
                  <p className="text-sm text-gray-600">{formatDocument(customer.document)}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {getStatusIcon(customer.status)}
                    <span className="ml-1">{getStatusText(customer.status)}</span>
                  </span>
                </div>

                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{customer.email}</span>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{customer.phone}</span>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <div>
                      <p>{customer.address.street}, {customer.address.number}</p>
                      <p>{customer.address.city} - {customer.address.state}</p>
                      <p>CEP: {customer.address.zipCode}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Cliente desde: {formatDate(customer.registrationDate)}</span>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="p-4 border-b border-gray-200">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Informações Financeiras
              </h5>

              {customer.lastInvoice && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Última Fatura</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInvoiceStatusColor(customer.lastInvoice.status)}`}>
                      {getInvoiceStatusText(customer.lastInvoice.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Valor: {formatCurrency(customer.lastInvoice.amount)}</p>
                    <p>Vencimento: {formatDate(customer.lastInvoice.dueDate)}</p>
                  </div>
                </div>
              )}

              {customer.totalDebt !== undefined && customer.totalDebt > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Débito Total</p>
                      <p className="text-sm text-red-600">{formatCurrency(customer.totalDebt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4">
              <h5 className="font-medium text-gray-900 mb-3">Ações Rápidas</h5>
              <div className="space-y-2">
                <button
                  onClick={() => setShowInvoices(!showInvoices)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Ver Faturas</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Ver Histórico</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {customer.email && (
                  <button
                    onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Enviar Email</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                )}

                {customer.phone && (
                  <button
                    onClick={() => window.open(`tel:${customer.phone}`, '_blank')}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Ligar</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Customer State */}
        {!customer && !requiresManualSearch && !loading && (
          <div className="p-4 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Nenhum cliente identificado nesta conversa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerContextPanel;


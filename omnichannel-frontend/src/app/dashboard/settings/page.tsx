'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils, settingsAPI, Settings, UpdateSettingsRequest, TestConnectionRequest } from '@/lib/api';
import { 
  Settings as SettingsIcon, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Copy,
  RefreshCw,
  Wifi,
  WifiOff,
  MessageSquare,
  Smartphone,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  FileText
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'channels' | 'integration'>('channels');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTokens, setShowTokens] = useState({
    whatsapp: false,
    erp: false
  });

  // Form data
  const [whatsappData, setWhatsappData] = useState({
    apiKey: '',
    endpointUrl: ''
  });
  const [erpData, setErpData] = useState({
    baseUrl: '',
    authToken: ''
  });
  const [webchatSnippet, setWebchatSnippet] = useState('');

  // Verificar se é admin
  const isAdmin = authUtils.isAuthenticated() && authUtils.isAdmin();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    loadSettings();
  }, [isAdmin, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      setSettings(response.settings);
      
      // Preencher formulários
      setWhatsappData({
        apiKey: response.settings.whatsapp_api_key || '',
        endpointUrl: response.settings.whatsapp_endpoint_url || ''
      });
      
      setErpData({
        baseUrl: response.settings.erp_api_base_url || '',
        authToken: response.settings.erp_api_auth_token || ''
      });

      // Carregar snippet do webchat
      if (response.settings.webchat_snippet_id) {
        loadWebchatSnippet();
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadWebchatSnippet = async () => {
    try {
      const response = await settingsAPI.getWebchatSnippet();
      setWebchatSnippet(response.snippet);
    } catch (err) {
      console.error('Erro ao carregar snippet:', err);
    }
  };

  const handleSaveWhatsApp = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData: UpdateSettingsRequest = {
        whatsappApiKey: whatsappData.apiKey,
        whatsappEndpointUrl: whatsappData.endpointUrl
      };

      const response = await settingsAPI.updateSettings(updateData);
      setSettings(response.settings);
      setSuccess('Configurações do WhatsApp salvas com sucesso!');
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndTestERP = async () => {
    setSaving(true);
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      // Primeiro salvar as configurações
      const updateData: UpdateSettingsRequest = {
        erpApiBaseUrl: erpData.baseUrl,
        erpApiAuthToken: erpData.authToken
      };

      await settingsAPI.updateSettings(updateData);

      // Depois testar a conexão
      const testData: TestConnectionRequest = {
        erpApiBaseUrl: erpData.baseUrl,
        erpApiAuthToken: erpData.authToken
      };

      const testResponse = await settingsAPI.testConnection(testData);
      
      if (testResponse.success) {
        setSuccess(testResponse.message);
        // Recarregar configurações para atualizar status
        loadSettings();
      } else {
        setError(testResponse.message);
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar e testar configurações';
      setError(errorMessage);
    } finally {
      setSaving(false);
      setTesting(false);
    }
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(webchatSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleRegenerateSnippet = async () => {
    try {
      setLoading(true);
      await settingsAPI.regenerateSnippet();
      await loadWebchatSnippet();
      setSuccess('Snippet regenerado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao regenerar snippet';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusIcon = () => {
    if (!settings) return <WifiOff className="h-4 w-4 text-gray-400" />;
    
    switch (settings.erp_connection_status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    if (!settings) return 'Não verificado';
    
    switch (settings.erp_connection_status) {
      case 'connected':
        return 'Conectado com sucesso';
      case 'failed':
        return 'Falha na conexão';
      default:
        return 'Não verificado';
    }
  };

  const getConnectionStatusColor = () => {
    if (!settings) return 'text-gray-500';
    
    switch (settings.erp_connection_status) {
      case 'connected':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
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
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <SettingsIcon className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Configurações
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('channels')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'channels'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Canais</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('integration')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'integration'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Integração</span>
                </div>
              </button>
              <button
                onClick={() => router.push('/dashboard/settings/templates')}
                className="py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Templates</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'channels' && (
              <div className="space-y-8">
                {/* Webchat Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Configuração do Webchat
                    </h2>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Para instalar o chat no seu site, copie e cole o código abaixo antes do fechamento da tag &lt;/body&gt;.
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Código de Instalação
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleRegenerateSnippet}
                          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Regenerar</span>
                        </button>
                        <button
                          onClick={handleCopySnippet}
                          className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={webchatSnippet}
                      readOnly
                      rows={8}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white font-mono text-sm resize-none focus:outline-none"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      ℹ️ Instruções de instalação:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Cole o código antes da tag &lt;/body&gt; do seu site</li>
                      <li>• O chat aparecerá automaticamente no canto inferior direito</li>
                      <li>• Funciona em sites HTML, WordPress, Shopify e outros</li>
                      <li>• Responsivo para desktop e mobile</li>
                    </ul>
                  </div>
                </div>

                {/* WhatsApp Section */}
                <div className="border-t pt-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Configuração do WhatsApp
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="whatsappApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          id="whatsappApiKey"
                          type={showTokens.whatsapp ? 'text' : 'password'}
                          value={whatsappData.apiKey}
                          onChange={(e) => setWhatsappData({ ...whatsappData, apiKey: e.target.value })}
                          className="block w-full pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Sua API Key do WhatsApp Business"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTokens({ ...showTokens, whatsapp: !showTokens.whatsapp })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showTokens.whatsapp ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="whatsappEndpoint" className="block text-sm font-medium text-gray-700 mb-2">
                        Endpoint URL
                      </label>
                      <input
                        id="whatsappEndpoint"
                        type="url"
                        value={whatsappData.endpointUrl}
                        onChange={(e) => setWhatsappData({ ...whatsappData, endpointUrl: e.target.value })}
                        className="block w-full py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://api.whatsapp.com/v1"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleSaveWhatsApp}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                      <span>Salvar Configurações do WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integration' && (
              <div className="space-y-8">
                {/* ERP Integration Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Configuração da API Externa
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="erpBaseUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        URL Base da API
                      </label>
                      <input
                        id="erpBaseUrl"
                        type="url"
                        value={erpData.baseUrl}
                        onChange={(e) => setErpData({ ...erpData, baseUrl: e.target.value })}
                        className="block w-full py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://api.cliente.com/v1"
                      />
                    </div>

                    <div>
                      <label htmlFor="erpAuthToken" className="block text-sm font-medium text-gray-700 mb-2">
                        Token de Autenticação
                      </label>
                      <div className="relative">
                        <input
                          id="erpAuthToken"
                          type={showTokens.erp ? 'text' : 'password'}
                          value={erpData.authToken}
                          onChange={(e) => setErpData({ ...erpData, authToken: e.target.value })}
                          className="block w-full pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Seu token de autenticação"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTokens({ ...showTokens, erp: !showTokens.erp })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showTokens.erp ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Status da Conexão:</span>
                        <div className="flex items-center space-x-1">
                          {getConnectionStatusIcon()}
                          <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                            {getConnectionStatusText()}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSaveAndTestERP}
                        disabled={saving || testing || !erpData.baseUrl || !erpData.authToken}
                        className="flex items-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        <span>
                          {testing ? 'Testando...' : 'Salvar e Testar Conexão'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">
                      ⚠️ Informações importantes:
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• A URL deve apontar para a API do seu sistema ERP</li>
                      <li>• O token deve ter permissões de leitura e escrita</li>
                      <li>• O teste verifica se o endpoint /health está acessível</li>
                      <li>• Mantenha o token seguro e não compartilhe</li>
                    </ul>
                  </div>
                </div>

                {/* Write Actions Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Ações de Escrita (WRITE)
                    </h2>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      💡 Sobre as Ações de Escrita:
                    </h4>
                    <p className="text-sm text-blue-800">
                      Configure aqui as ações que o chatbot poderá executar para modificar dados no seu ERP. 
                      Cada ação define um endpoint específico e o formato dos dados que serão enviados.
                    </p>
                  </div>

                  {/* Lista de Ações Existentes */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Ações Configuradas</h3>
                        <button
                          onClick={() => {/* TODO: Abrir modal de nova ação */}}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          + Nova Ação
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {/* TODO: Lista de ações existentes */}
                      <div className="text-center py-8 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma ação de escrita configurada ainda.</p>
                        <p className="text-sm">Clique em "Nova Ação" para começar.</p>
                      </div>
                    </div>
                  </div>

                  {/* Exemplo de Configuração */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      📋 Exemplo de Configuração:
                    </h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Nome da Ação:</strong> "Atualizar Telefone e Email"</p>
                      <p><strong>Método HTTP:</strong> PUT</p>
                      <p><strong>Endpoint:</strong> /clientes/{'{{customer_identifier}}'}/contato</p>
                      <p><strong>Corpo da Requisição:</strong></p>
                      <pre className="bg-gray-100 p-2 rounded text-xs mt-1">
{`{
  "email": "{{email_cliente}}",
  "telefone": "{{telefone_cliente}}"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


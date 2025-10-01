'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { FaArrowLeft, FaArrowRight, FaSave, FaCalendarAlt, FaUsers, FaFileAlt, FaCheck } from 'react-icons/fa';

// Tipos
interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  whatsapp_template_id: string | null;
  status: string;
}

interface TargetCriteria {
  region?: string;
  status?: string;
  lastInteraction?: string;
  customField?: string;
}

interface TemplateVariables {
  [key: string]: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  
  // Estado para controlar o passo atual
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estado para os dados da campanha
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [targetCriteria, setTargetCriteria] = useState<TargetCriteria>({});
  const [templateVariables, setTemplateVariables] = useState<TemplateVariables>({});
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Estado para dados auxiliares
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Carregar templates aprovados
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/message-templates/status/APPROVED');
        
        if (response.data.success) {
          setTemplates(response.data.data);
        } else {
          setError('Erro ao carregar templates');
        }
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
        setError('Erro ao carregar templates. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Atualizar template selecionado quando o ID mudar
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
      
      // Resetar variáveis do template
      if (template) {
        // Extrair variáveis do corpo do template (formato {{1}}, {{2}}, etc.)
        const variableMatches = template.body.match(/{{(\d+)}}/g) || [];
        const uniqueVariables = [...new Set(variableMatches)];
        
        const initialVariables: TemplateVariables = {};
        uniqueVariables.forEach(variable => {
          const varNumber = variable.replace('{{', '').replace('}}', '');
          initialVariables[varNumber] = '';
        });
        
        setTemplateVariables(initialVariables);
      }
    }
  }, [selectedTemplateId, templates]);
  
  // Avançar para o próximo passo
  const handleNextStep = () => {
    // Validar dados do passo atual
    if (currentStep === 1 && (!campaignName || !selectedTemplateId)) {
      setError('Preencha o nome da campanha e selecione um template');
      return;
    }
    
    if (currentStep === 3 && Object.values(templateVariables).some(value => !value)) {
      setError('Preencha todas as variáveis do template');
      return;
    }
    
    if (currentStep === 4 && !scheduledDate) {
      setError('Selecione uma data de agendamento');
      return;
    }
    
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  // Voltar para o passo anterior
  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Atualizar critérios de segmentação
  const handleTargetCriteriaChange = (field: keyof TargetCriteria, value: string) => {
    setTargetCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Atualizar variáveis do template
  const handleTemplateVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };
  
  // Criar campanha
  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Combinar data e hora
      let scheduledDateTime = null;
      if (scheduledDate) {
        const dateStr = scheduledDate;
        const timeStr = scheduledTime || '12:00';
        scheduledDateTime = new Date(`${dateStr}T${timeStr}`).toISOString();
      }
      
      const campaignData = {
        name: campaignName,
        message_template_id: selectedTemplateId,
        target_criteria: targetCriteria,
        template_variables: templateVariables,
        scheduled_at: scheduledDateTime,
        status: scheduledDateTime ? 'SCHEDULED' : 'DRAFT'
      };
      
      const response = await api.post('/api/campaigns', campaignData);
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/campaigns');
        }, 2000);
      } else {
        setError('Erro ao criar campanha');
      }
    } catch (err) {
      console.error('Erro ao criar campanha:', err);
      setError('Erro ao criar campanha. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar conteúdo com base no passo atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 1: Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Campanha de Aviso de Manutenção - Outubro 2025"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template de Mensagem
                </label>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span>Carregando templates...</span>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p>Nenhum template aprovado encontrado. Crie e aprove um template antes de criar uma campanha.</p>
                  </div>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Selecione um template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.whatsapp_template_id ? `(ID: ${template.whatsapp_template_id})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {selectedTemplate && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Prévia do Template:</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedTemplate.body}</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 2: Segmentação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Região
                </label>
                <select
                  value={targetCriteria.region || ''}
                  onChange={(e) => handleTargetCriteriaChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todas as regiões</option>
                  <option value="norte">Norte</option>
                  <option value="sul">Sul</option>
                  <option value="leste">Leste</option>
                  <option value="oeste">Oeste</option>
                  <option value="centro">Centro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status do Cliente
                </label>
                <select
                  value={targetCriteria.status || ''}
                  onChange={(e) => handleTargetCriteriaChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos os status</option>
                  <option value="adimplente">Adimplente</option>
                  <option value="inadimplente">Inadimplente</option>
                  <option value="novo">Novo cliente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Última Interação
                </label>
                <select
                  value={targetCriteria.lastInteraction || ''}
                  onChange={(e) => handleTargetCriteriaChange('lastInteraction', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Qualquer período</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="never">Nunca interagiu</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campo Personalizado
                </label>
                <input
                  type="text"
                  value={targetCriteria.customField || ''}
                  onChange={(e) => handleTargetCriteriaChange('customField', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: tipo_medidor=digital"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <p className="text-sm">
                  <strong>Nota:</strong> A segmentação será aplicada aos dados do ERP para determinar os destinatários da campanha.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 3: Variáveis do Template</h2>
            
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Template:</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedTemplate.body}</p>
                </div>
                
                {Object.keys(templateVariables).length > 0 ? (
                  <div className="space-y-4">
                    {Object.keys(templateVariables).map((variable) => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Variável {variable}
                        </label>
                        <input
                          type="text"
                          value={templateVariables[variable]}
                          onChange={(e) => handleTemplateVariableChange(variable, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Valor para {{${variable}}}`}
                        />
                      </div>
                    ))}
                    
                    <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                      <p className="text-sm">
                        <strong>Importante:</strong> Estes valores serão usados como padrão para todos os destinatários. 
                        Variáveis específicas por cliente serão obtidas do ERP quando disponíveis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p>Este template não possui variáveis para preencher.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Nenhum template selecionado. Volte ao passo 1 e selecione um template.</p>
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 4: Agendamento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Envio
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Envio
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <p className="text-sm">
                  <strong>Nota:</strong> Se você não definir uma data e hora, a campanha será salva como rascunho e poderá ser agendada posteriormente.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Resumo da Campanha:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><strong>Nome:</strong> {campaignName}</li>
                  <li><strong>Template:</strong> {selectedTemplate?.name || 'Não selecionado'}</li>
                  <li>
                    <strong>Segmentação:</strong>
                    <ul className="ml-4 mt-1">
                      <li>Região: {targetCriteria.region || 'Todas'}</li>
                      <li>Status: {targetCriteria.status || 'Todos'}</li>
                      <li>Última Interação: {targetCriteria.lastInteraction || 'Qualquer período'}</li>
                      {targetCriteria.customField && <li>Personalizado: {targetCriteria.customField}</li>}
                    </ul>
                  </li>
                  <li>
                    <strong>Agendamento:</strong> {scheduledDate ? `${scheduledDate} ${scheduledTime || '12:00'}` : 'Rascunho (não agendado)'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Renderizar indicador de progresso
  const renderProgressBar = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex flex-col items-center ${
                step <= currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? (
                  <FaCheck className="w-4 h-4" />
                ) : (
                  step
                )}
              </div>
              <span className="mt-2 text-xs font-medium">
                {step === 1 && 'Informações'}
                {step === 2 && 'Segmentação'}
                {step === 3 && 'Variáveis'}
                {step === 4 && 'Agendamento'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 w-full bg-gray-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/campaigns')}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Voltar para Campanhas
        </button>
        <h1 className="text-2xl font-bold mt-2">Nova Campanha</h1>
      </div>
      
      {/* Indicador de progresso */}
      {renderProgressBar()}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Mensagem de sucesso */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Campanha criada com sucesso! Redirecionando...
        </div>
      )}
      
      {/* Conteúdo do passo atual */}
      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        {renderStepContent()}
      </div>
      
      {/* Botões de navegação */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1 || loading}
          className={`px-4 py-2 rounded-md flex items-center ${
            currentStep === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <FaArrowLeft className="mr-2" /> Anterior
        </button>
        
        {currentStep < 4 ? (
          <button
            onClick={handleNextStep}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            Próximo <FaArrowRight className="ml-2" />
          </button>
        ) : (
          <button
            onClick={handleCreateCampaign}
            disabled={loading || success}
            className={`px-4 py-2 rounded-md flex items-center ${
              loading || success
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Criar Campanha
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


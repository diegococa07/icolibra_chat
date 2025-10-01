'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils, flowsAPI, ChatbotFlow, CreateFlowRequest, UpdateFlowRequest } from '@/lib/api';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
  ArrowLeft, 
  Save, 
  Play, 
  Pause,
  Plus,
  MessageSquare,
  Menu,
  Zap,
  Users,
  AlertCircle,
  CheckCircle,
  Trash2,
  Copy,
  FileText,
  Database
} from 'lucide-react';

// Tipos de nós personalizados
const nodeTypes: NodeTypes = {
  sendMessage: ({ data, selected }: any) => (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} min-w-[200px]`}>
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <div className="font-bold text-sm">Enviar Mensagem</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 truncate">
        {data.message || 'Clique para configurar...'}
      </div>
    </div>
  ),
  
  menuButtons: ({ data, selected }: any) => (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-green-500' : 'border-gray-200'} min-w-[200px]`}>
      <div className="flex items-center space-x-2">
        <Menu className="h-4 w-4 text-green-500" />
        <div className="font-bold text-sm">Menu com Botões</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {data.buttons?.length ? `${data.buttons.length} botões` : 'Clique para configurar...'}
      </div>
    </div>
  ),
  
  integration: ({ data, selected }: any) => (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-purple-500' : 'border-gray-200'} min-w-[200px]`}>
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4 text-purple-500" />
        <div className="font-bold text-sm">Ação de Integração</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 truncate">
        {data.action || 'Clique para configurar...'}
      </div>
    </div>
  ),
  
  transfer: ({ data, selected }: any) => (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-orange-500' : 'border-gray-200'} min-w-[200px]`}>
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-orange-500" />
        <div className="font-bold text-sm">Transferir para Atendente</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 truncate">
        {data.queue || 'Clique para configurar...'}
      </div>
    </div>
  ),

  collectInfo: ({ data, selected }: any) => (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-yellow-500' : 'border-gray-200'} min-w-[200px]`}>
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-yellow-500" />
        <div className="font-bold text-sm">Coletar Informação</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 truncate">
        {data.variableName ? `Variável: ${data.variableName}` : 'Clique para configurar...'}
      </div>
    </div>
  ),

  executeWriteAction: ({ data, selected }: any) => (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${selected ? 'border-red-500' : 'border-gray-200'} min-w-[200px]`}>
      <div className="flex items-center space-x-2">
        <Database className="h-4 w-4 text-red-500" />
        <div className="font-bold text-sm">Executar Ação de Escrita</div>
      </div>
      <div className="text-xs text-gray-500 mt-1 truncate">
        {data.writeActionId ? 'Ação configurada' : 'Clique para configurar...'}
      </div>
    </div>
  ),
};

// Tipos de nós disponíveis
const nodeTemplates = [
  {
    type: 'sendMessage',
    label: 'Enviar Mensagem',
    icon: MessageSquare,
    color: 'blue',
    data: { message: '' }
  },
  {
    type: 'menuButtons',
    label: 'Menu com Botões',
    icon: Menu,
    color: 'green',
    data: { message: '', buttons: [] }
  },
  {
    type: 'integration',
    label: 'Ação de Integração',
    icon: Zap,
    color: 'purple',
    data: { action: '', input: '' }
  },
  {
    type: 'transfer',
    label: 'Transferir para Atendente',
    icon: Users,
    color: 'orange',
    data: { queue: '' }
  },
  {
    type: 'collectInfo',
    label: 'Coletar Informação',
    icon: FileText,
    color: 'yellow',
    data: { 
      userMessage: '', 
      validationType: 'text', 
      variableName: '', 
      errorMessage: '' 
    }
  },
  {
    type: 'executeWriteAction',
    label: 'Executar Ação de Escrita',
    icon: Database,
    color: 'red',
    data: { writeActionId: '' }
  }
];

export default function FlowBuilderPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [currentFlow, setCurrentFlow] = useState<ChatbotFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar se é admin
  const isAdmin = authUtils.isAuthenticated() && authUtils.isAdmin();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    // Carregar fluxo ativo se existir
    loadActiveFlow();
  }, [isAdmin, router]);

  const loadActiveFlow = async () => {
    try {
      setLoading(true);
      const response = await flowsAPI.getActiveFlow();
      setCurrentFlow(response.flow);
      setFlowName(response.flow.name);
      setFlowDescription(response.flow.description || '');
      
      // Carregar definição do fluxo no canvas
      if (response.flow.flow_definition && typeof response.flow.flow_definition === 'object') {
        const flowDef = response.flow.flow_definition as any;
        if (flowDef.nodes && flowDef.edges) {
          setNodes(flowDef.nodes);
          setEdges(flowDef.edges);
        }
      }
    } catch (err) {
      // Se não há fluxo ativo, criar um novo
      console.log('Nenhum fluxo ativo encontrado');
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = (template: typeof nodeTemplates[0]) => {
    const newNode: Node = {
      id: `${template.type}_${Date.now()}`,
      type: template.type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { ...template.data },
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  };

  const saveFlow = async () => {
    if (!flowName.trim()) {
      setError('Nome do fluxo é obrigatório');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const flowDefinition = {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      if (currentFlow) {
        // Atualizar fluxo existente
        const updateData: UpdateFlowRequest = {
          name: flowName,
          description: flowDescription,
          flow_definition: flowDefinition
        };
        
        const response = await flowsAPI.updateFlow(currentFlow.id, updateData);
        setCurrentFlow(response.flow);
      } else {
        // Criar novo fluxo
        const createData: CreateFlowRequest = {
          name: flowName,
          description: flowDescription,
          flow_definition: flowDefinition
        };
        
        const response = await flowsAPI.createFlow(createData);
        setCurrentFlow(response.flow);
      }

      setSuccess('Fluxo salvo com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar fluxo';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const publishFlow = async () => {
    if (!currentFlow) {
      setError('Salve o fluxo antes de publicar');
      return;
    }

    if (nodes.length === 0) {
      setError('Adicione pelo menos um nó antes de publicar');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await flowsAPI.publishFlow(currentFlow.id);
      setCurrentFlow(response.flow);
      setSuccess('Fluxo publicado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao publicar fluxo';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const unpublishFlow = async () => {
    if (!currentFlow) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await flowsAPI.unpublishFlow(currentFlow.id);
      setCurrentFlow(response.flow);
      setSuccess('Fluxo despublicado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao despublicar fluxo';
      setError(errorMessage);
    } finally {
      setSaving(false);
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
          <p className="text-gray-600">Carregando construtor de fluxo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="p-1 bg-green-100 rounded">
                  <Menu className="h-5 w-5 text-green-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Construtor de Fluxo
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Nome do fluxo..."
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              
              <button
                onClick={saveFlow}
                disabled={saving}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Salvar</span>
              </button>

              {currentFlow && (
                <button
                  onClick={currentFlow.is_active ? unpublishFlow : publishFlow}
                  disabled={saving}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentFlow.is_active
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {currentFlow.is_active ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{currentFlow.is_active ? 'Despublicar' : 'Publicar'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {(success || error) && (
        <div className="px-4 py-2 bg-white border-b">
          {success && (
            <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-2 text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Node Palette */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Tipos de Nós
          </h3>
          <div className="space-y-2">
            {nodeTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => addNode(template)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-${template.color}-400 hover:bg-${template.color}-50 transition-colors group`}
                >
                  <IconComponent className={`h-5 w-5 text-${template.color}-500`} />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {template.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Flow Info */}
          {currentFlow && (
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Status do Fluxo
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${currentFlow.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                    {currentFlow.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nós:</span>
                  <span className="font-medium text-gray-900">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conexões:</span>
                  <span className="font-medium text-gray-900">{edges.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Propriedades
          </h3>
          
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  {nodeTemplates.find(t => t.type === selectedNode.type)?.label}
                </h4>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      const newNode = {
                        ...selectedNode,
                        id: `${selectedNode.type}_${Date.now()}`,
                        position: {
                          x: selectedNode.position.x + 20,
                          y: selectedNode.position.y + 20
                        }
                      };
                      setNodes((nds) => [...nds, newNode]);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Send Message Properties */}
              {selectedNode.type === 'sendMessage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={selectedNode.data.message || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Digite a mensagem que o bot enviará..."
                  />
                </div>
              )}

              {/* Menu Buttons Properties */}
              {selectedNode.type === 'menuButtons' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem Principal
                    </label>
                    <textarea
                      value={selectedNode.data.message || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Digite a pergunta ou mensagem..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Botões (máximo 3)
                    </label>
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="mb-2">
                        <input
                          type="text"
                          value={selectedNode.data.buttons?.[index] || ''}
                          onChange={(e) => {
                            const buttons = [...(selectedNode.data.buttons || [])];
                            buttons[index] = e.target.value;
                            updateNodeData(selectedNode.id, { buttons });
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder={`Botão ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integration Properties */}
              {selectedNode.type === 'integration' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ação
                    </label>
                    <select
                      value={selectedNode.data.action || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { action: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma ação...</option>
                      <option value="buscar_fatura_cpf">Buscar Fatura por CPF</option>
                      <option value="consultar_historico">Consultar Histórico</option>
                      <option value="verificar_status">Verificar Status</option>
                      <option value="buscar_produto">Buscar Produto</option>
                      <option value="consultar_proxima_leitura">Consultar Próxima Leitura (Mock)</option>
                      <option value="verificar_status_abastecimento">Verificar Status de Abastecimento (Mock)</option>
                      <option value="simular_valor_fatura">Simular Valor da Fatura (Mock)</option>
                      <option value="buscar_proposta_negociacao">Buscar Proposta de Negociação (Mock)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campo de Entrada
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.input || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { input: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ex: CPF, Código do produto..."
                    />
                  </div>
                </div>
              )}

              {/* Transfer Properties */}
              {selectedNode.type === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fila de Atendimento
                  </label>
                  <select
                    value={selectedNode.data.queue || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { queue: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma fila...</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="suporte">Suporte Técnico</option>
                    <option value="vendas">Vendas</option>
                    <option value="geral">Atendimento Geral</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <Menu className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                Selecione um nó no canvas para editar suas propriedades
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


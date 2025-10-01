'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Users, MessageSquare, BarChart3, Settings } from 'lucide-react';

interface DemoStats {
  total_conversations: number;
  active_conversations: number;
  total_messages: number;
  mock_api_calls: number;
}

export default function ControleDemo() {
  const [stats, setStats] = useState<DemoStats>({
    total_conversations: 0,
    active_conversations: 0,
    total_messages: 0,
    mock_api_calls: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Atualizar stats a cada 5 segundos
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/public/demo/status');
      if (response.ok) {
        const data = await response.json();
        // Simular algumas estatísticas para demonstração
        setStats({
          total_conversations: Math.floor(Math.random() * 50) + 10,
          active_conversations: Math.floor(Math.random() * 5) + 1,
          total_messages: Math.floor(Math.random() * 200) + 50,
          mock_api_calls: Math.floor(Math.random() * 30) + 5
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemo = async () => {
    if (confirm('Tem certeza que deseja resetar a demonstração?')) {
      setIsLoading(true);
      try {
        // Aqui poderia chamar um endpoint para limpar dados de demo
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular reset
        await loadStats();
        alert('Demonstração resetada com sucesso!');
      } catch (error) {
        console.error('Erro ao resetar demo:', error);
        alert('Erro ao resetar demonstração');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openSimulator = () => {
    window.open('/demonstracao', '_blank');
  };

  const openDashboard = () => {
    window.open('/dashboard', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎭 Painel de Controle - Demonstração</h1>
              <p className="text-gray-600 mt-1">Gerencie e monitore a demonstração da Plataforma Omnichannel</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={openSimulator}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Abrir Simulador</span>
              </button>
              <button
                onClick={openDashboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Abrir Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversas Totais</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.total_conversations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.active_conversations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mensagens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.total_messages}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chamadas API Mock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats.mock_api_calls}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Controles de Demonstração */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles de Demonstração</h3>
            <div className="space-y-4">
              <button
                onClick={resetDemo}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isLoading ? 'Resetando...' : 'Resetar Demonstração'}</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openSimulator}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Simulador</span>
                </button>
                
                <button
                  onClick={openDashboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Informações da Demo */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Demonstração</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Credenciais Demo</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Admin:</strong> demo@plataforma.com / demo123<br />
                  <strong>Atendente:</strong> atendente@plataforma.com / demo123<br />
                  <strong>Supervisor:</strong> supervisor@plataforma.com / demo123
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Clientes Fictícios</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>CPF 111.111.111-11:</strong> Maria Adimplente<br />
                  <strong>CPF 222.222.222-22:</strong> João Inadimplente
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Roteiro de Demonstração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Simulador WhatsApp</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Abra o simulador em nova aba</li>
                <li>• Digite um CPF (111.111.111-11 ou 222.222.222-22)</li>
                <li>• Demonstre o fluxo de consulta de dados</li>
                <li>• Teste a atualização de dados de contato</li>
                <li>• Mostre a transferência para atendente</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Dashboard Administrativo</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Faça login com demo@plataforma.com</li>
                <li>• Mostre as conversas em tempo real</li>
                <li>• Demonstre os relatórios de performance</li>
                <li>• Exiba o construtor de fluxo visual</li>
                <li>• Apresente a gestão de equipes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


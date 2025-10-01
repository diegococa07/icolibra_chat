'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Bot, 
  Download,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Timer
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { reportsAPI } from '@/lib/api';

// Inter// Interfaces
interface ReportSummary {
  period: string;
  total_conversations: number;
  conversations_by_channel: {
    channel_type: string;
    channel_name: string;
    count: number;
  }[];
  automation_efficiency: {
    resolved_by_bot: number;
    with_human_intervention: number;
    bot_resolution_rate: number;
  };
  additional_metrics: {
    avg_messages_per_conversation: number;
    conversations_with_protocol: number;
    protocol_success_rate: number;
  };
}

interface PerformanceMetrics {
  tma: {
    seconds: number | null;
    formatted: string | null;
    description: string;
  };
  tmr: {
    seconds: number | null;
    formatted: string | null;
    description: string;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('last7days');
  const [error, setError] = useState<string | null>(null);

  // Carregar dados quando período muda
  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar dados do resumo
      const summaryResponse = await reportsAPI.getSummary(selectedPeriod);
      setSummary(summaryResponse.summary);
      
      // Carregar dados de performance (TMA e TMR)
      const performanceResponse = await reportsAPI.getPerformance(selectedPeriod);
      setPerformanceMetrics(performanceResponse.data.performance_metrics);
      
    } catch (error: any) {
      console.error('Erro ao carregar relatório:', error);
      setError(error.response?.data?.error || 'Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await reportsAPI.exportData(selectedPeriod, format);
      
      if (format === 'csv') {
        // Para CSV, criar download do arquivo
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${selectedPeriod}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Para JSON, mostrar em nova janela ou download
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${selectedPeriod}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados');
    }
  };

  // Preparar dados para gráfico de rosca (automação)
  const automationData = summary ? [
    { name: 'Resolvido pelo Bot', value: summary.automation_efficiency.resolved_by_bot, color: '#10B981' },
    { name: 'Com Intervenção Humana', value: summary.automation_efficiency.with_human_intervention, color: '#3B82F6' }
  ] : [];

  // Preparar dados para gráfico de barras (canais)
  const channelData = summary?.conversations_by_channel.map((channel, index) => ({
    name: channel.channel_name,
    conversas: channel.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao Carregar Relatórios</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadReportData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-8 w-8 text-indigo-600 mr-3" />
                Relatórios e Métricas
              </h1>
              <p className="text-gray-600 mt-1">
                Análise de performance e eficiência da plataforma
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Seletor de Período */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="last7days">Últimos 7 dias</option>
                  <option value="last30days">Últimos 30 dias</option>
                  <option value="last90days">Últimos 90 dias</option>
                  <option value="thismonth">Este mês</option>
                  <option value="lastmonth">Mês passado</option>
                </select>
              </div>

              {/* Botões de Exportação */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>

              {/* Botão de Atualizar */}
              <button
                onClick={loadReportData}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {summary && (
          <>
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total de Atendimentos */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Atendimentos</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total_conversations}</p>
                  </div>
                </div>
              </div>

              {/* Taxa de Automação */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bot className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Taxa de Automação</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.automation_efficiency.bot_resolution_rate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Média de Mensagens */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Média de Mensagens</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.additional_metrics.avg_messages_per_conversation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Taxa de Protocolo */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Taxa de Protocolo</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.additional_metrics.protocol_success_rate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de Performance (TMA e TMR) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* TMA - Tempo Médio de Atendimento */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">TMA - Tempo Médio de Atendimento</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceMetrics?.tma.formatted || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {performanceMetrics?.tma.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* TMR - Tempo de Primeira Resposta */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-500">
                <div className="flex items-center">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Timer className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">TMR - Tempo de Primeira Resposta</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceMetrics?.tmr.formatted || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {performanceMetrics?.tmr.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfico de Eficiência da Automação (Rosca) */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="h-5 w-5 text-indigo-600 mr-2" />
                  Eficiência da Automação
                </h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={automationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {automationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Resolvido pelo Bot</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {summary.automation_efficiency.resolved_by_bot}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Com Intervenção Humana</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {summary.automation_efficiency.with_human_intervention}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Atendimentos por Canal */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
                  Atendimentos por Canal
                </h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2">
                  {summary.conversations_by_channel.map((channel, index) => (
                    <div key={channel.channel_type} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm text-gray-600">{channel.channel_name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {channel.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Métricas Adicionais */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Métricas Detalhadas - {summary.period}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">
                    {summary.automation_efficiency.resolved_by_bot}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Conversas Resolvidas pelo Bot</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.automation_efficiency.with_human_intervention}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Com Intervenção Humana</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {summary.additional_metrics.conversations_with_protocol}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Conversas com Protocolo ERP</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationProvider, NotificationIndicator } from '@/components/NotificationProvider';
import { usersAPI, conversationsAPI, authAPI, authUtils, User } from '@/lib/api';
import { 
  Shield, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  MessageSquare, 
  Users, 
  BarChart3,
  CheckCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se está autenticado
    if (!authUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Carregar dados do usuário
    loadUserData();
  }, [router]);

  const loadUserData = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      // Se falhar, usar dados do localStorage
      const localUser = authUtils.getUser();
      if (localUser) {
        setUser(localUser);
      } else {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      authUtils.clearAuth();
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Plataforma Omnichannel
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* Indicador de notificações */}
                <NotificationIndicator />
                
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      {user?.role === 'ADMIN' ? 'Administrador' : 'Atendente'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user.full_name || user.email}!
          </h2>
          <p className="text-gray-600">
            Aqui está um resumo da sua plataforma de atendimento omnichannel.
          </p>
        </div>

        {/* 2FA Status */}
        <div className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Autenticação de Dois Fatores Ativada
              </h3>
              <p className="text-sm text-green-700">
                Sua conta está protegida com 2FA desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversas Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Atendidos</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-semibold text-gray-900">0min</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Segurança</p>
                <p className="text-2xl font-semibold text-gray-900">100%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conversas
            </h3>
            <p className="text-gray-600 mb-4">
              Gerencie conversas ativas e histórico de atendimentos.
            </p>
            <button 
              onClick={() => router.push('/dashboard/conversations')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver Conversas
            </button>
          </div>

          {isAdmin && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Usuários
                </h3>
                <p className="text-gray-600 mb-4">
                  Gerencie usuários, permissões e configurações de acesso.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/users')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Gerenciar Usuários
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Relatórios
                </h3>
                <p className="text-gray-600 mb-4">
                  Visualize métricas e performance da plataforma.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/reports')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Ver Relatórios
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configurações
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure integrações, canais e fluxos de chatbot.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/settings')}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Configurar
                </button>
              </div>
            </>
          )}

          {!isAdmin && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configurações
              </h3>
              <p className="text-gray-600 mb-4">
                Configure integrações, canais e fluxos de chatbot.
              </p>
              <button 
                disabled
                className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
              >
                Acesso Restrito
              </button>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Próximos Passos
          </h3>
          <div className="space-y-2">
            <p className="text-blue-800">
              ✅ Sistema de autenticação configurado com 2FA
            </p>
            <p className="text-blue-700">
              🔄 Configurar integrações (WhatsApp, ERP)
            </p>
            <p className="text-blue-700">
              🔄 Criar fluxos de chatbot
            </p>
            <p className="text-blue-700">
              🔄 Configurar canais de atendimento
            </p>
          </div>
        </div>
      </main>
    </div>
    </NotificationProvider>
  );
}


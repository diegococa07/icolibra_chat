'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authUtils, usersAPI, teamsAPI, CreateUserRequest } from '@/lib/api';
import { 
  UserPlus, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Copy,
  Mail,
  User,
  Users
} from 'lucide-react';

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: '',
    email: '',
    role: 'AGENT',
    team_id: ''
  });
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [provisionalPassword, setProvisionalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Verificar se é admin
  if (!authUtils.isAuthenticated() || !authUtils.isAdmin()) {
    router.push('/dashboard');
    return null;
  }

  // Carregar equipes disponíveis
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const response = await teamsAPI.list();
        setTeams(response.teams || []);
      } catch (err) {
        console.error('Erro ao carregar equipes:', err);
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await usersAPI.createAgent(formData);
      
      setProvisionalPassword(response.provisionalPassword);
      setSuccess(true);
      
      // Limpar formulário
      setFormData({ fullName: '', email: '', role: 'AGENT', team_id: '' });
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar atendente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(provisionalPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleCreateAnother = () => {
    setSuccess(false);
    setProvisionalPassword('');
    setError('');
  };

  const handleBackToList = () => {
    router.push('/dashboard/users');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Voltar para Lista</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h1 className="text-xl font-semibold text-gray-900">
                    Atendente Criado com Sucesso
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Success Content */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Atendente Criado!
              </h2>
              <p className="text-gray-600">
                O novo atendente foi criado com sucesso. Compartilhe a senha provisória abaixo.
              </p>
            </div>

            {/* Password Display */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                🔑 Senha Provisória
              </h3>
              
              <div className="bg-white rounded-lg p-4 border border-yellow-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={provisionalPassword}
                      readOnly
                      className="w-full text-lg font-mono bg-transparent border-none outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={copyPassword}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copiar senha"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-yellow-700">
                <p className="font-medium mb-2">⚠️ Instruções importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Compartilhe esta senha com o atendente de forma segura</li>
                  <li>O atendente deve fazer login e configurar o 2FA no primeiro acesso</li>
                  <li>Esta senha será substituída após a configuração do 2FA</li>
                  <li>Guarde esta senha até confirmar que o atendente fez o primeiro login</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleCreateAnother}
                className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Criar Outro Atendente</span>
              </button>
              <button
                onClick={handleBackToList}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Voltar para Lista
              </button>
            </div>
          </div>
        </main>
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
                onClick={() => router.push('/dashboard/users')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <UserPlus className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Adicionar Novo Atendente
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="joao@empresa.com"
                />
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Função *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="AGENT">Atendente</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>
            </div>

            {/* Team Field */}
            <div>
              <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-2">
                Equipe {formData.role === 'SUPERVISOR' ? '*' : '(Opcional)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="team_id"
                  name="team_id"
                  required={formData.role === 'SUPERVISOR'}
                  value={formData.team_id}
                  onChange={handleChange}
                  disabled={loadingTeams}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Selecione uma equipe</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              {loadingTeams && (
                <p className="text-sm text-gray-500 mt-1">Carregando equipes...</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Informações importantes:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Uma senha provisória será gerada automaticamente</li>
                <li>• O usuário receberá as credenciais para o primeiro login</li>
                <li>• O 2FA será obrigatório no primeiro acesso</li>
                <li>• Atendentes têm acesso limitado, Supervisores gerenciam equipes</li>
                <li>• Supervisores devem obrigatoriamente pertencer a uma equipe</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/users')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Criando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Criar Atendente</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


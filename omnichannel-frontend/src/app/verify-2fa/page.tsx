'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, authUtils } from '@/lib/api';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Verify2FAPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Recuperar credenciais da sessão
    const sessionEmail = sessionStorage.getItem('login_email');
    const sessionPassword = sessionStorage.getItem('login_password');

    if (!sessionEmail || !sessionPassword) {
      router.push('/login');
      return;
    }

    setEmail(sessionEmail);
    setPassword(sessionPassword);
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verify2FA(email, password, token);
      
      // Salvar token completo
      authUtils.saveAuth(response.token, response.user);
      
      // Limpar dados da sessão
      sessionStorage.removeItem('login_email');
      sessionStorage.removeItem('login_password');
      
      // Redirecionar para dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao verificar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    sessionStorage.removeItem('login_email');
    sessionStorage.removeItem('login_password');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Verificação em Duas Etapas
            </h2>
            <p className="text-gray-600 mt-2">
              Insira o código do seu aplicativo autenticador
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Email Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Fazendo login como:
              </p>
              <p className="font-medium text-gray-900">
                {email}
              </p>
            </div>

            {/* Token Field */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Código de 6 dígitos
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="block w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-3xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Abra seu aplicativo autenticador e insira o código atual
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                'Verificar'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6">
            <button
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao login</span>
            </button>
          </div>

          {/* Help */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Problemas com o código?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verifique se o horário do seu dispositivo está correto</li>
              <li>• Aguarde o próximo código (30 segundos)</li>
              <li>• Certifique-se de usar o aplicativo correto</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Plataforma de Atendimento Omnichannel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, authUtils } from '@/lib/api';
import { Shield, AlertCircle, CheckCircle, Copy, Smartphone } from 'lucide-react';
import Image from 'next/image';

export default function Setup2FAPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Verificar se tem token temporário
    if (!authUtils.isAuthenticated()) {
      router.push('/login');
      return;
    }

    generateQRCode();
  }, [router]);

  const generateQRCode = async () => {
    try {
      setGenerating(true);
      const response = await authAPI.generate2FA();
      setQrCode(response.qrCode);
      setSecret(response.secret);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar QR Code');
    } finally {
      setGenerating(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.activate2FA(token);
      
      // Salvar token completo
      authUtils.saveAuth(response.token, response.user);
      
      // Redirecionar para dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao ativar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const formatSecret = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gerando configuração 2FA...
            </h2>
            <p className="text-gray-600">
              Aguarde um momento
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Configure sua Autenticação de Dois Fatores
            </h2>
            <p className="text-gray-600 mt-2">
              Para sua segurança, o 2FA é obrigatório nesta plataforma
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                1. Escaneie o QR Code
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                {qrCode && (
                  <Image
                    src={qrCode}
                    alt="QR Code para 2FA"
                    width={200}
                    height={200}
                    className="mx-auto border rounded-lg"
                  />
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>Use um aplicativo autenticador como:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Google Authenticator</li>
                  <li>Authy</li>
                  <li>Microsoft Authenticator</li>
                </ul>
              </div>

              {/* Manual Secret */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Ou insira manualmente:
                </h4>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-800 break-all">
                    {formatSecret(secret)}
                  </code>
                  <button
                    onClick={copySecret}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copiar segredo"
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

            {/* Verification Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                2. Verifique o código
              </h3>

              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                    Código de 6 dígitos
                  </label>
                  <input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Insira o código gerado pelo seu aplicativo autenticador
                  </p>
                </div>

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
                    'Verificar e Ativar'
                  )}
                </button>
              </form>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  💡 Dicas importantes:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mantenha seu aplicativo autenticador sempre atualizado</li>
                  <li>• Faça backup do código secreto em local seguro</li>
                  <li>• O código muda a cada 30 segundos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-gray-500">
              Após ativar o 2FA, você precisará do código a cada login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


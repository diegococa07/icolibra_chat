import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações para domínio personalizado
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Permitir domínios personalizados
  experimental: {
    allowedHosts: [
      'icolibrachat.hecotech.com.br',
      '3001-ibm9e2tpgyi1y3a08h5id-e61bfc4f.manusvm.computer',
      'localhost'
    ]
  }
};

export default nextConfig;

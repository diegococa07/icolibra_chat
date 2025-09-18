import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { testConnection } from './database/connection';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import flowRoutes from './routes/flows';
import conversationRoutes from './routes/conversations';
import customerRoutes from './routes/customers';
import reportsRoutes from './routes/reports';
import teamRoutes from './routes/teams';
import systemMessageRoutes from './routes/systemMessages';
import writeActionRoutes from './routes/writeActions';
import messageTemplateRoutes from './routes/messageTemplates';
import campaignRoutes from './routes/campaigns';
import mockErpRoutes from './routes/mockErp';
import publicRoutes from './routes/public';
import { logAuthenticatedAction } from './middleware/auth';
import { socketManager } from './utils/socketManager';
import { initializeJobs } from './jobs';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Inicializar Socket.IO
socketManager.initialize(server);

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging para ações autenticadas
app.use(logAuthenticatedAction);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/system-messages', systemMessageRoutes);
app.use('/api/write-actions', writeActionRoutes);
app.use('/api/message-templates', messageTemplateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/mock-erp', mockErpRoutes);
app.use('/api/public', publicRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Omnichannel Platform API',
    version: '1.0.0'
  });
});

// Rota de teste da conexão com banco
app.get('/health/database', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      status: isConnected ? 'OK' : 'ERROR',
      database: isConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      status: 404,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com banco de dados
    console.log('🔍 Testando conexão com banco de dados...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      console.log('💡 Certifique-se de que o PostgreSQL está rodando e as configurações estão corretas');
      console.log('💡 Verifique o arquivo .env com as configurações do banco');
      process.exit(1);
    }

    // Iniciar servidor HTTP com Socket.IO
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Servidor iniciado com sucesso!');
      console.log(`📡 API rodando em: http://0.0.0.0:${PORT}`);
      console.log(`🔌 Socket.IO habilitado para notificações em tempo real`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🗄️  Database check: http://0.0.0.0:${PORT}/health/database`);
      console.log('📝 Logs do servidor:');
      
      // Inicializar jobs
      initializeJobs()
        .then(() => console.log('🔄 Jobs de processamento em background inicializados'))
        .catch(err => console.error('❌ Erro ao inicializar jobs:', err));
    });

  } catch (error) {
    console.error('💥 Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar aplicação
startServer();

export default app;


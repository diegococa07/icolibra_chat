"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const connection_1 = require("./database/connection");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const settings_1 = __importDefault(require("./routes/settings"));
const flows_1 = __importDefault(require("./routes/flows"));
const conversations_1 = __importDefault(require("./routes/conversations"));
const customers_1 = __importDefault(require("./routes/customers"));
const reports_1 = __importDefault(require("./routes/reports"));
const auth_2 = require("./middleware/auth");
const socketManager_1 = require("./utils/socketManager");
// Carregar variáveis de ambiente
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
// Inicializar Socket.IO
socketManager_1.socketManager.initialize(server);
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Middleware de logging para ações autenticadas
app.use(auth_2.logAuthenticatedAction);
// Rotas da API
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/flows', flows_1.default);
app.use('/api/conversations', conversations_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/reports', reports_1.default);
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
        const isConnected = await (0, connection_1.testConnection)();
        res.json({
            status: isConnected ? 'OK' : 'ERROR',
            database: isConnected ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// Middleware de tratamento de erros
app.use((err, req, res, next) => {
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
app.use('*', (req, res) => {
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
        const isConnected = await (0, connection_1.testConnection)();
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
        });
    }
    catch (error) {
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
exports.default = app;
//# sourceMappingURL=index.js.map
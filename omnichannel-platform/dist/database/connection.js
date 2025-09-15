"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.query = exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'omnichannel_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
// Criar pool de conexões
exports.pool = new pg_1.Pool(poolConfig);
// Função para testar a conexão
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao conectar com PostgreSQL:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Função para executar queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executada:', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        console.error('Erro na query:', { text, error });
        throw error;
    }
};
exports.query = query;
// Função para fechar o pool de conexões
const closePool = async () => {
    await exports.pool.end();
    console.log('Pool de conexões PostgreSQL fechado');
};
exports.closePool = closePool;
//# sourceMappingURL=connection.js.map
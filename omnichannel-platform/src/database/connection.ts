import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
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
export const pool = new Pool(poolConfig);

// Função para testar a conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    return false;
  }
};

// Função para executar queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', { text, error });
    throw error;
  }
};

// Função para fechar o pool de conexões
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Pool de conexões PostgreSQL fechado');
};


import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do pool de conexões
const pool = new Pool({
  user: process.env.DB_USER || 'omnichannel',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'omnichannel_platform',
  password: process.env.DB_PASSWORD || 'omnichannel',
  port: parseInt(process.env.DB_PORT || '5432'),
});

/**
 * Executa uma query no banco de dados
 * @param text Query SQL
 * @param params Parâmetros da query
 * @returns Resultado da query
 */
export const query = async (text: string, params: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

/**
 * Inicia uma transação no banco de dados
 * @returns Cliente para a transação
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Verifica a conexão com o banco de dados
 * @returns true se a conexão estiver funcionando
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await query('SELECT NOW()', []);
    return res.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed', error);
    return false;
  }
};

export default {
  query,
  getClient,
  testConnection
};


import { RedisOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Redis para BullMQ
export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  // Configurações adicionais para melhorar a estabilidade
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  connectTimeout: 10000,
};

// Prefixo para as filas do BullMQ
export const queuePrefix = 'omnichannel';

// Nomes das filas
export const queueNames = {
  campaignScheduler: `${queuePrefix}-campaign-scheduler`,
  campaignSender: `${queuePrefix}-campaign-sender`,
  messageProcessor: `${queuePrefix}-message-processor`,
};

// Configurações de repetição para jobs que falham
export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 segundos
  },
  removeOnComplete: true,
  removeOnFail: false,
};

// Configurações para jobs agendados
export const scheduledJobOptions = {
  ...defaultJobOptions,
  repeat: {
    pattern: '* * * * *', // A cada minuto
  },
};

// Configurações para controle de taxa de envio
export const rateLimitOptions = {
  max: 30, // Máximo de mensagens por segundo
  duration: 1000, // 1 segundo
};


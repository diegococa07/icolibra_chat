import { campaignScheduler } from './campaignScheduler';
import { campaignSender } from './campaignSender';
import { messageProcessor } from './messageProcessor';
import { logger } from '../utils/logger';

/**
 * Inicializa todos os jobs
 */
export const initializeJobs = async (): Promise<void> => {
  try {
    // Inicializar agendador de campanhas
    campaignScheduler.initialize();
    
    // Inicializar sender de campanhas
    campaignSender.initialize();
    
    // Inicializar processador de mensagens
    messageProcessor.initialize();
    
    logger.info('All jobs initialized successfully');
  } catch (error) {
    logger.error(`Error initializing jobs: ${error}`);
    throw error;
  }
};

export * from './queue';
export * from './campaignScheduler';
export * from './campaignSender';
export * from './messageProcessor';


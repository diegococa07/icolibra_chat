import { Job } from 'bullmq';
import { queueManager, queueNames, addCampaignSenderJob } from './queue';
import { CampaignModel } from '../models/Campaign';
import { logger } from '../utils/logger';
import { scheduledJobOptions } from '../config/redis';
import { CampaignStatus } from '../types';

// Interface para dados do job
interface CampaignSchedulerData {
  checkTime?: Date;
}

/**
 * Job agendador que verifica campanhas agendadas e inicia o processo de envio
 */
export class CampaignScheduler {
  private campaignModel: CampaignModel;

  constructor() {
    this.campaignModel = new CampaignModel();
  }

  /**
   * Inicializa o job agendador
   */
  public initialize(): void {
    // Criar scheduler para execução periódica
    queueManager.createScheduler(queueNames.campaignScheduler);

    // Criar worker para processar jobs
    queueManager.createWorker(
      queueNames.campaignScheduler,
      this.process.bind(this),
      1
    );

    // Adicionar job recorrente (a cada minuto)
    this.scheduleRecurringJob();

    logger.info('Campaign scheduler initialized');
  }

  /**
   * Agenda o job recorrente
   */
  private async scheduleRecurringJob(): Promise<void> {
    try {
      const queue = queueManager.getQueue(queueNames.campaignScheduler);
      
      // Remover jobs recorrentes existentes
      await queue.removeRepeatable('scheduler', { pattern: '* * * * *' });
      
      // Adicionar novo job recorrente
      await queue.add(
        'scheduler',
        { checkTime: new Date() },
        {
          ...scheduledJobOptions,
          jobId: 'campaign-scheduler',
        }
      );
      
      logger.info('Campaign scheduler recurring job scheduled');
    } catch (error) {
      logger.error(`Error scheduling recurring job: ${error}`);
    }
  }

  /**
   * Processa o job agendador
   */
  public async process(job: Job<CampaignSchedulerData>): Promise<any> {
    try {
      logger.info(`Processing campaign scheduler job ${job.id}`);
      
      // Obter data atual
      const now = new Date();
      
      // Buscar campanhas agendadas que já passaram da data de agendamento
      const campaigns = await this.campaignModel.findScheduledBetween(
        new Date(0), // Desde o início dos tempos
        now // Até agora
      );
      
      logger.info(`Found ${campaigns.length} campaigns to process`);
      
      // Processar cada campanha
      for (const campaign of campaigns) {
        try {
          // Atualizar status da campanha para SENDING
          await this.campaignModel.updateStatus(campaign.id, CampaignStatus.SENDING);
          
          logger.info(`Campaign ${campaign.id} status updated to SENDING`);
          
          // Adicionar job para enviar a campanha
          await addCampaignSenderJob(
            {
              campaignId: campaign.id,
              startTime: now,
            },
            {
              jobId: `campaign-sender-${campaign.id}`,
              attempts: 3,
            }
          );
          
          logger.info(`Campaign sender job added for campaign ${campaign.id}`);
        } catch (error) {
          logger.error(`Error processing campaign ${campaign.id}: ${error}`);
        }
      }
      
      return { processed: campaigns.length };
    } catch (error) {
      logger.error(`Error in campaign scheduler: ${error}`);
      throw error;
    }
  }
}

// Instância singleton do agendador de campanhas
export const campaignScheduler = new CampaignScheduler();


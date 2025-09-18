import { Job } from 'bullmq';
import { queueManager, queueNames, addMessageProcessorJob } from './queue';
import { CampaignModel } from '../models/Campaign';
import { logger } from '../utils/logger';
import { CampaignStatus } from '../types';
import { fetchTargetCustomers } from '../utils/campaignErpIntegration';
import { rateLimitOptions } from '../config/redis';

// Interface para dados do job
interface CampaignSenderData {
  campaignId: string;
  startTime: Date;
}

/**
 * Job responsável pelo envio de campanhas
 */
export class CampaignSender {
  private campaignModel: CampaignModel;

  constructor() {
    this.campaignModel = new CampaignModel();
  }

  /**
   * Inicializa o job de envio
   */
  public initialize(): void {
    // Criar worker para processar jobs
    queueManager.createWorker(
      queueNames.campaignSender,
      this.process.bind(this),
      1
    );

    logger.info('Campaign sender initialized');
  }

  /**
   * Processa o job de envio
   */
  public async process(job: Job<CampaignSenderData>): Promise<any> {
    try {
      const { campaignId, startTime } = job.data;
      logger.info(`Processing campaign sender job for campaign ${campaignId}`);
      
      // Buscar campanha
      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      
      // Verificar se a campanha está no status correto
      if (campaign.status !== CampaignStatus.SENDING) {
        throw new Error(`Campaign ${campaignId} is not in SENDING status`);
      }
      
      // Buscar template (simulado para o teste)
      const template = { id: campaign.message_template_id, body: "Olá {{1}}, temos uma mensagem para você." };
      
      // Buscar destinatários com base nos critérios
      const customers = await fetchTargetCustomers(campaign.target_criteria);
      logger.info(`Found ${customers.length} customers for campaign ${campaignId}`);
      
      // Registrar progresso
      await job.updateProgress(10);
      
      // Enfileirar mensagens individuais
      let enqueueCount = 0;
      const totalCustomers = customers.length;
      
      for (let i = 0; i < totalCustomers; i++) {
        const customer = customers[i];
        
        try {
          // Adicionar job para processar mensagem individual
          await addMessageProcessorJob(
            {
              campaignId,
              templateId: campaign.message_template_id,
              templateVariables: campaign.template_variables,
              customer,
            },
            {
              jobId: `message-processor-${campaignId}-${customer.id || i}`,
              attempts: 3,
              // Implementar rate limiting para não sobrecarregar a API do WhatsApp
              delay: Math.floor(i / rateLimitOptions.max) * rateLimitOptions.duration,
            }
          );
          
          enqueueCount++;
          
          // Atualizar progresso a cada 10% dos clientes
          if (i % Math.max(1, Math.floor(totalCustomers / 10)) === 0) {
            const progress = Math.floor(10 + (i / totalCustomers) * 80);
            await job.updateProgress(progress);
          }
        } catch (error) {
          logger.error(`Error enqueueing message for customer ${customer.id || i}: ${error}`);
        }
      }
      
      // Atualizar progresso
      await job.updateProgress(90);
      
      // Atualizar status da campanha para COMPLETED se todas as mensagens foram enfileiradas
      if (enqueueCount === totalCustomers) {
        await this.campaignModel.updateStatus(campaignId, CampaignStatus.COMPLETED);
        logger.info(`Campaign ${campaignId} status updated to COMPLETED`);
      } else {
        logger.warn(`Campaign ${campaignId} had errors: ${enqueueCount}/${totalCustomers} messages enqueued`);
      }
      
      // Atualizar progresso final
      await job.updateProgress(100);
      
      return {
        campaignId,
        totalCustomers,
        enqueueCount,
        completionTime: new Date(),
      };
    } catch (error) {
      logger.error(`Error in campaign sender: ${error}`);
      throw error;
    }
  }
}

// Instância singleton do sender de campanhas
export const campaignSender = new CampaignSender();


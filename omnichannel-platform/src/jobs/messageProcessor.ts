import { Job } from 'bullmq';
import { queueManager, queueNames } from './queue';
import { logger } from '../utils/logger';
import { Customer } from '../utils/campaignErpIntegration';

// Interface para dados do job
interface MessageProcessorData {
  campaignId: string;
  templateId: string;
  templateVariables: Record<string, any>;
  customer: Customer;
}

/**
 * Job responsável pelo processamento de mensagens individuais
 */
export class MessageProcessor {
  /**
   * Inicializa o job de processamento de mensagens
   */
  public initialize(): void {
    // Criar worker para processar jobs
    queueManager.createWorker(
      queueNames.messageProcessor,
      this.process.bind(this),
      5 // Concorrência maior para processamento de mensagens
    );

    logger.info('Message processor initialized');
  }

  /**
   * Processa o job de mensagem individual
   */
  public async process(job: Job<MessageProcessorData>): Promise<any> {
    try {
      const { campaignId, templateId, templateVariables, customer } = job.data;
      logger.info(`Processing message for campaign ${campaignId}, customer ${customer.id || customer.name}`);
      
      // Simular template para teste
      const template = { 
        id: templateId, 
        body: "Olá {{1}}, temos uma mensagem para você sobre {{company}}." 
      };
      
      // Substituir variáveis no template
      const messageContent = this.replaceTemplateVariables(template.body, templateVariables, customer);
      
      // Registrar progresso
      await job.updateProgress(50);
      
      // Enviar mensagem via WhatsApp API
      const result = await this.sendWhatsAppMessage(customer.phone, messageContent, templateId);
      
      // Registrar progresso final
      await job.updateProgress(100);
      
      return {
        campaignId,
        customerId: customer.id,
        messageId: result.messageId,
        status: result.status,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error(`Error in message processor: ${error}`);
      throw error;
    }
  }

  /**
   * Substitui variáveis no template
   */
  private replaceTemplateVariables(
    templateBody: string,
    templateVariables: Record<string, any>,
    customer: Customer
  ): string {
    let result = templateBody;
    
    // Substituir variáveis do template
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value.toString());
    });
    
    // Substituir variáveis numeradas ({{1}}, {{2}}, etc.)
    const numberedVariables = [
      customer.name,
      customer.cpf || '',
      customer.city || '',
      customer.region || '',
      // Adicionar mais variáveis conforme necessário
    ];
    
    numberedVariables.forEach((value, index) => {
      const regex = new RegExp(`{{${index + 1}}}`, 'g');
      result = result.replace(regex, value.toString());
    });
    
    // Substituir variáveis do cliente
    Object.entries(customer).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{customer.${key}}}`, 'g');
        result = result.replace(regex, value.toString());
      }
    });
    
    return result;
  }

  /**
   * Envia mensagem via WhatsApp API
   */
  private async sendWhatsAppMessage(
    phone: string,
    content: string,
    templateId?: string
  ): Promise<{ messageId: string; status: string }> {
    try {
      // Em ambiente de produção, isso seria uma chamada real para a API do WhatsApp
      // Para o ambiente de demonstração, simulamos o envio
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      // Simular envio bem-sucedido
      logger.info(`Message sent to ${phone}: ${content.substring(0, 50)}...`);
      
      // Gerar ID de mensagem único
      const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      return {
        messageId,
        status: 'sent',
      };
    } catch (error) {
      logger.error(`Error sending WhatsApp message: ${error}`);
      throw error;
    }
  }
}

// Instância singleton do processador de mensagens
export const messageProcessor = new MessageProcessor();


import { Queue, Worker, QueueScheduler, Job, ConnectionOptions } from 'bullmq';
import { redisConfig, queueNames, defaultJobOptions } from '../config/redis';
import { logger } from '../utils/logger';

// Tipo para dados de job
export interface JobData {
  [key: string]: any;
}

// Classe base para gerenciar filas
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private schedulers: Map<string, QueueScheduler> = new Map();
  private connection: ConnectionOptions;

  constructor() {
    this.connection = redisConfig;
  }

  // Criar uma nova fila
  public createQueue(name: string): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: this.connection,
      defaultJobOptions,
    });

    this.queues.set(name, queue);
    logger.info(`Queue created: ${name}`);
    return queue;
  }

  // Criar um worker para processar jobs
  public createWorker(
    name: string,
    processor: (job: Job) => Promise<any>,
    concurrency: number = 1
  ): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker(
      name,
      async (job: Job) => {
        try {
          logger.info(`Processing job ${job.id} of type ${name}`);
          const result = await processor(job);
          logger.info(`Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          logger.error(`Error processing job ${job.id}: ${error}`);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency,
      }
    );

    // Eventos do worker
    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} has been completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} has failed with error: ${error.message}`);
    });

    worker.on('error', (error) => {
      logger.error(`Worker error: ${error.message}`);
    });

    this.workers.set(name, worker);
    logger.info(`Worker created for queue: ${name} with concurrency: ${concurrency}`);
    return worker;
  }

  // Criar um scheduler para jobs recorrentes
  public createScheduler(name: string): QueueScheduler {
    if (this.schedulers.has(name)) {
      return this.schedulers.get(name)!;
    }

    const scheduler = new QueueScheduler(name, {
      connection: this.connection,
    });

    this.schedulers.set(name, scheduler);
    logger.info(`Scheduler created for queue: ${name}`);
    return scheduler;
  }

  // Adicionar um job à fila
  public async addJob(
    queueName: string,
    data: JobData,
    options: any = {}
  ): Promise<Job> {
    const queue = this.getQueue(queueName);
    const jobName = options.jobName || 'default';
    
    const job = await queue.add(jobName, data, options);
    logger.info(`Job ${job.id} added to queue ${queueName}`);
    return job;
  }

  // Adicionar um job recorrente à fila
  public async addRecurringJob(
    queueName: string,
    jobName: string,
    data: JobData,
    options: any = {}
  ): Promise<Job> {
    const queue = this.getQueue(queueName);
    
    const job = await queue.add(jobName, data, {
      ...options,
      repeat: options.repeat,
    });
    
    logger.info(`Recurring job ${jobName} added to queue ${queueName}`);
    return job;
  }

  // Obter uma fila existente
  public getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      return this.createQueue(name);
    }
    return this.queues.get(name)!;
  }

  // Fechar todas as conexões
  public async close(): Promise<void> {
    const workerPromises = Array.from(this.workers.values()).map((worker) =>
      worker.close()
    );
    
    const queuePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close()
    );
    
    const schedulerPromises = Array.from(this.schedulers.values()).map((scheduler) =>
      scheduler.close()
    );

    await Promise.all([
      ...workerPromises,
      ...queuePromises,
      ...schedulerPromises,
    ]);
    
    logger.info('All queues, workers and schedulers closed');
  }
}

// Instância singleton do gerenciador de filas
export const queueManager = new QueueManager();

// Criar filas principais
export const campaignSchedulerQueue = queueManager.createQueue(queueNames.campaignScheduler);
export const campaignSenderQueue = queueManager.createQueue(queueNames.campaignSender);
export const messageProcessorQueue = queueManager.createQueue(queueNames.messageProcessor);

// Exportar funções auxiliares para adicionar jobs
export const addCampaignSchedulerJob = async (data: JobData, options: any = {}) => {
  return queueManager.addJob(queueNames.campaignScheduler, data, options);
};

export const addCampaignSenderJob = async (data: JobData, options: any = {}) => {
  return queueManager.addJob(queueNames.campaignSender, data, options);
};

export const addMessageProcessorJob = async (data: JobData, options: any = {}) => {
  return queueManager.addJob(queueNames.messageProcessor, data, options);
};


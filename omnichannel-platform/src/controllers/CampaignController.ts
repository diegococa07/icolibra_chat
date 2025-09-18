import { Request, Response } from 'express';
import { CampaignModel, MessageTemplateModel } from '../models';
import { CampaignStatus, MessageTemplateStatus } from '../types';

export class CampaignController {
  /**
   * Lista todas as campanhas
   */
  static async listAll(req: Request, res: Response): Promise<void> {
    try {
      const campaigns = await CampaignModel.findAll();
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      console.error('Erro ao listar campanhas:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar campanhas' });
    }
  }

  /**
   * Lista campanhas por status
   */
  static async listByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      // Validar se o status é válido
      if (!Object.values(CampaignStatus).includes(status as CampaignStatus)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(CampaignStatus).join(', ')}` 
        });
        return;
      }
      
      const campaigns = await CampaignModel.findByStatus(status as CampaignStatus);
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      console.error('Erro ao listar campanhas por status:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar campanhas por status' });
    }
  }

  /**
   * Busca campanhas agendadas para um período
   */
  static async listScheduledBetween(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: 'Datas de início e fim são obrigatórias' });
        return;
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ success: false, message: 'Formato de data inválido' });
        return;
      }
      
      const campaigns = await CampaignModel.findScheduledBetween(start, end);
      res.status(200).json({ success: true, data: campaigns });
    } catch (error) {
      console.error('Erro ao listar campanhas agendadas:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar campanhas agendadas' });
    }
  }

  /**
   * Busca uma campanha pelo ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);
      
      if (!campaign) {
        res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        return;
      }
      
      res.status(200).json({ success: true, data: campaign });
    } catch (error) {
      console.error('Erro ao buscar campanha:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar campanha' });
    }
  }

  /**
   * Cria uma nova campanha
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, message_template_id, target_criteria, template_variables, scheduled_at, status } = req.body;
      
      // Validações
      if (!name) {
        res.status(400).json({ success: false, message: 'Nome da campanha é obrigatório' });
        return;
      }
      
      if (!message_template_id) {
        res.status(400).json({ success: false, message: 'ID do template de mensagem é obrigatório' });
        return;
      }
      
      // Verificar se o template existe e está aprovado
      const template = await MessageTemplateModel.findById(message_template_id);
      if (!template) {
        res.status(400).json({ success: false, message: 'Template de mensagem não encontrado' });
        return;
      }
      
      if (template.status !== MessageTemplateStatus.APPROVED) {
        res.status(400).json({ 
          success: false, 
          message: 'Apenas templates aprovados podem ser usados em campanhas' 
        });
        return;
      }
      
      // Validar target_criteria
      if (!target_criteria || typeof target_criteria !== 'object') {
        res.status(400).json({ success: false, message: 'Critérios de segmentação inválidos' });
        return;
      }
      
      // Validar template_variables
      if (!template_variables || typeof template_variables !== 'object') {
        res.status(400).json({ success: false, message: 'Variáveis do template inválidas' });
        return;
      }
      
      // Validar scheduled_at se fornecido
      let scheduledDate = null;
      if (scheduled_at) {
        scheduledDate = new Date(scheduled_at);
        if (isNaN(scheduledDate.getTime())) {
          res.status(400).json({ success: false, message: 'Data de agendamento inválida' });
          return;
        }
        
        // Verificar se a data é futura
        if (scheduledDate <= new Date()) {
          res.status(400).json({ success: false, message: 'Data de agendamento deve ser futura' });
          return;
        }
      }
      
      // Validar status se fornecido
      if (status && !Object.values(CampaignStatus).includes(status)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(CampaignStatus).join(', ')}` 
        });
        return;
      }
      
      // Criar a campanha
      const campaign = await CampaignModel.create({
        name,
        message_template_id,
        target_criteria,
        template_variables,
        scheduled_at: scheduledDate,
        status: status || CampaignStatus.DRAFT
      });
      
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      res.status(500).json({ success: false, message: 'Erro ao criar campanha' });
    }
  }

  /**
   * Atualiza uma campanha existente
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, message_template_id, target_criteria, template_variables, scheduled_at, status } = req.body;
      
      // Verificar se a campanha existe
      const existingCampaign = await CampaignModel.findById(id);
      if (!existingCampaign) {
        res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        return;
      }
      
      // Verificar se a campanha já está em execução ou concluída
      if (existingCampaign.status === CampaignStatus.SENDING || existingCampaign.status === CampaignStatus.COMPLETED) {
        res.status(400).json({ 
          success: false, 
          message: 'Não é possível editar uma campanha que já está em execução ou concluída' 
        });
        return;
      }
      
      // Validar message_template_id se fornecido
      if (message_template_id) {
        const template = await MessageTemplateModel.findById(message_template_id);
        if (!template) {
          res.status(400).json({ success: false, message: 'Template de mensagem não encontrado' });
          return;
        }
        
        if (template.status !== MessageTemplateStatus.APPROVED) {
          res.status(400).json({ 
            success: false, 
            message: 'Apenas templates aprovados podem ser usados em campanhas' 
          });
          return;
        }
      }
      
      // Validar scheduled_at se fornecido
      let scheduledDate = undefined;
      if (scheduled_at) {
        scheduledDate = new Date(scheduled_at);
        if (isNaN(scheduledDate.getTime())) {
          res.status(400).json({ success: false, message: 'Data de agendamento inválida' });
          return;
        }
        
        // Verificar se a data é futura
        if (scheduledDate <= new Date()) {
          res.status(400).json({ success: false, message: 'Data de agendamento deve ser futura' });
          return;
        }
      }
      
      // Validar status se fornecido
      if (status && !Object.values(CampaignStatus).includes(status as CampaignStatus)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(CampaignStatus).join(', ')}` 
        });
        return;
      }
      
      // Atualizar a campanha
      const updatedCampaign = await CampaignModel.update(id, {
        name,
        message_template_id,
        target_criteria,
        template_variables,
        scheduled_at: scheduledDate,
        status: status as CampaignStatus
      });
      
      res.status(200).json({ success: true, data: updatedCampaign });
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      res.status(500).json({ success: false, message: 'Erro ao atualizar campanha' });
    }
  }

  /**
   * Atualiza apenas o status de uma campanha
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validar status
      if (!status || !Object.values(CampaignStatus).includes(status as CampaignStatus)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(CampaignStatus).join(', ')}` 
        });
        return;
      }
      
      // Verificar se a campanha existe
      const existingCampaign = await CampaignModel.findById(id);
      if (!existingCampaign) {
        res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        return;
      }
      
      // Verificar transições de status válidas
      if (existingCampaign.status === CampaignStatus.COMPLETED) {
        res.status(400).json({ 
          success: false, 
          message: 'Não é possível alterar o status de uma campanha concluída' 
        });
        return;
      }
      
      if (existingCampaign.status === CampaignStatus.SENDING && status !== CampaignStatus.COMPLETED) {
        res.status(400).json({ 
          success: false, 
          message: 'Uma campanha em execução só pode ser alterada para concluída' 
        });
        return;
      }
      
      // Atualizar o status
      const updatedCampaign = await CampaignModel.updateStatus(id, status as CampaignStatus);
      
      res.status(200).json({ success: true, data: updatedCampaign });
    } catch (error) {
      console.error('Erro ao atualizar status da campanha:', error);
      res.status(500).json({ success: false, message: 'Erro ao atualizar status da campanha' });
    }
  }

  /**
   * Exclui uma campanha
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar se a campanha existe
      const existingCampaign = await CampaignModel.findById(id);
      if (!existingCampaign) {
        res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        return;
      }
      
      // Verificar se a campanha já está em execução ou concluída
      if (existingCampaign.status === CampaignStatus.SENDING || existingCampaign.status === CampaignStatus.COMPLETED) {
        res.status(400).json({ 
          success: false, 
          message: 'Não é possível excluir uma campanha que já está em execução ou concluída' 
        });
        return;
      }
      
      // Excluir a campanha
      const deleted = await CampaignModel.delete(id);
      
      if (deleted) {
        res.status(200).json({ success: true, message: 'Campanha excluída com sucesso' });
      } else {
        res.status(500).json({ success: false, message: 'Erro ao excluir campanha' });
      }
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      res.status(500).json({ success: false, message: 'Erro ao excluir campanha' });
    }
  }

  /**
   * Simula o envio de uma campanha (para testes)
   */
  static async simulateSend(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar se a campanha existe
      const campaign = await CampaignModel.findById(id);
      if (!campaign) {
        res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        return;
      }
      
      // Verificar se o template existe
      const template = await MessageTemplateModel.findById(campaign.message_template_id);
      if (!template) {
        res.status(404).json({ success: false, message: 'Template não encontrado' });
        return;
      }
      
      // Simular busca de destinatários com base nos critérios de segmentação
      // Em um ambiente real, isso seria uma chamada à API do ERP
      const customers = [
        { id: '1', name: 'Maria Silva', phone: '5511999999999', email: 'maria@example.com', region: 'Sudeste', city: 'São Paulo' },
        { id: '2', name: 'João Santos', phone: '5511888888888', email: 'joao@example.com', region: 'Sudeste', city: 'Rio de Janeiro' },
        { id: '3', name: 'Ana Oliveira', phone: '5511777777777', email: 'ana@example.com', region: 'Sul', city: 'Curitiba' },
        { id: '4', name: 'Carlos Pereira', phone: '5511666666666', email: 'carlos@example.com', region: 'Nordeste', city: 'Recife' },
        { id: '5', name: 'Fernanda Lima', phone: '5511555555555', email: 'fernanda@example.com', region: 'Centro-Oeste', city: 'Brasília' }
      ];
      
      // Filtrar clientes com base nos critérios de segmentação
      const filteredCustomers = customers.filter(customer => {
        // Verificar região
        if (campaign.target_criteria.region && customer.region !== campaign.target_criteria.region) {
          return false;
        }
        
        // Verificar cidade
        if (campaign.target_criteria.city && customer.city !== campaign.target_criteria.city) {
          return false;
        }
        
        return true;
      });
      
      // Simular envio para cada destinatário
      const results = {
        campaign_id: id,
        campaign_name: campaign.name,
        template_name: template.name,
        total_recipients: filteredCustomers.length,
        success_count: 0,
        failed_count: 0,
        messages: [] as any[]
      };
      
      // Processar cada destinatário
      for (const customer of filteredCustomers) {
        try {
          // Substituir variáveis do template
          let messageText = template.body;
          
          // Substituir variáveis numeradas ({{1}}, {{2}}, etc.)
          messageText = messageText.replace(/\{\{1\}\}/g, customer.name);
          messageText = messageText.replace(/\{\{2\}\}/g, customer.city || '');
          messageText = messageText.replace(/\{\{3\}\}/g, customer.region || '');
          
          // Substituir variáveis nomeadas ({{company}}, etc.)
          for (const [key, value] of Object.entries(campaign.template_variables)) {
            messageText = messageText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
          }
          
          // Simular envio (com 90% de chance de sucesso)
          const success = Math.random() < 0.9;
          
          if (success) {
            results.success_count++;
            results.messages.push({
              customer_id: customer.id,
              customer_name: customer.name,
              phone: customer.phone,
              status: 'sent',
              message: messageText
            });
          } else {
            results.failed_count++;
            results.messages.push({
              customer_id: customer.id,
              customer_name: customer.name,
              phone: customer.phone,
              status: 'failed',
              error: 'Falha na entrega da mensagem'
            });
          }
        } catch (error) {
          results.failed_count++;
          results.messages.push({
            customer_id: customer.id,
            customer_name: customer.name,
            phone: customer.phone,
            status: 'failed',
            error: 'Erro ao processar mensagem'
          });
        }
      }
      
      res.status(200).json({ success: true, data: results });
      
    } catch (error) {
      console.error('Erro ao simular envio de campanha:', error);
      res.status(500).json({ success: false, message: 'Erro ao simular envio de campanha' });
    }
  }
}


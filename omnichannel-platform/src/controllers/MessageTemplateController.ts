import { Request, Response } from 'express';
import { MessageTemplateModel } from '../models';
import { MessageTemplateStatus } from '../types';

class MessageTemplateController {
  /**
   * Lista todos os templates de mensagem
   */
  static async listAll(req: Request, res: Response): Promise<void> {
    try {
      const templates = await MessageTemplateModel.findAll();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Erro ao listar templates de mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar templates de mensagem' });
    }
  }

  /**
   * Lista templates de mensagem por status
   */
  static async listByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      
      // Validar se o status é válido
      if (!Object.values(MessageTemplateStatus).includes(status as MessageTemplateStatus)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(MessageTemplateStatus).join(', ')}` 
        });
        return;
      }
      
      const templates = await MessageTemplateModel.findByStatus(status as MessageTemplateStatus);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Erro ao listar templates de mensagem por status:', error);
      res.status(500).json({ success: false, message: 'Erro ao listar templates de mensagem por status' });
    }
  }

  /**
   * Busca um template de mensagem pelo ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await MessageTemplateModel.findById(id);
      
      if (!template) {
        res.status(404).json({ success: false, message: 'Template de mensagem não encontrado' });
        return;
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Erro ao buscar template de mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao buscar template de mensagem' });
    }
  }

  /**
   * Cria um novo template de mensagem
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, body, whatsapp_template_id, status } = req.body;
      
      // Validar campos obrigatórios
      if (!name || !body) {
        res.status(400).json({ success: false, message: 'Nome e corpo do template são obrigatórios' });
        return;
      }
      
      // Validar status se fornecido
      if (status && !Object.values(MessageTemplateStatus).includes(status)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(MessageTemplateStatus).join(', ')}` 
        });
        return;
      }
      
      const template = await MessageTemplateModel.create({
        name,
        body,
        whatsapp_template_id,
        status: status as MessageTemplateStatus
      });
      
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      console.error('Erro ao criar template de mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao criar template de mensagem' });
    }
  }

  /**
   * Atualiza um template de mensagem existente
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, body, whatsapp_template_id, status } = req.body;
      
      // Verificar se o template existe
      const existingTemplate = await MessageTemplateModel.findById(id);
      if (!existingTemplate) {
        res.status(404).json({ success: false, message: 'Template de mensagem não encontrado' });
        return;
      }
      
      // Validar status se fornecido
      if (status && !Object.values(MessageTemplateStatus).includes(status)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(MessageTemplateStatus).join(', ')}` 
        });
        return;
      }
      
      const updatedTemplate = await MessageTemplateModel.update(id, {
        name,
        body,
        whatsapp_template_id,
        status: status as MessageTemplateStatus
      });
      
      if (!updatedTemplate) {
        res.status(400).json({ success: false, message: 'Nenhum campo fornecido para atualização' });
        return;
      }
      
      res.json({ success: true, data: updatedTemplate });
    } catch (error) {
      console.error('Erro ao atualizar template de mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao atualizar template de mensagem' });
    }
  }

  /**
   * Atualiza o status de um template de mensagem
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Verificar se o template existe
      const existingTemplate = await MessageTemplateModel.findById(id);
      if (!existingTemplate) {
        res.status(404).json({ success: false, message: 'Template de mensagem não encontrado' });
        return;
      }
      
      // Validar status
      if (!status || !Object.values(MessageTemplateStatus).includes(status)) {
        res.status(400).json({ 
          success: false, 
          message: `Status inválido. Valores permitidos: ${Object.values(MessageTemplateStatus).join(', ')}` 
        });
        return;
      }
      
      const updatedTemplate = await MessageTemplateModel.updateStatus(id, status as MessageTemplateStatus);
      
      res.json({ success: true, data: updatedTemplate });
    } catch (error) {
      console.error('Erro ao atualizar status do template de mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao atualizar status do template de mensagem' });
    }
  }

  /**
   * Exclui um template de mensagem
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar se o template existe
      const existingTemplate = await MessageTemplateModel.findById(id);
      if (!existingTemplate) {
        res.status(404).json({ success: false, message: 'Template de mensagem não encontrado' });
        return;
      }
      
      const deleted = await MessageTemplateModel.delete(id);
      
      if (deleted) {
        res.json({ success: true, message: 'Template de mensagem excluído com sucesso' });
      } else {
        res.status(500).json({ success: false, message: 'Erro ao excluir template de mensagem' });
      }
    } catch (error) {
      console.error('Erro ao excluir template de mensagem:', error);
      res.status(500).json({ success: false, message: 'Erro ao excluir template de mensagem' });
    }
  }
}

export default MessageTemplateController;


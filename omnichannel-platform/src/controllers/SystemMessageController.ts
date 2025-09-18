import { Request, Response } from 'express';
import { SystemMessageModel, SystemMessage } from '../models';

export class SystemMessageController {

  /**
   * GET /api/system-messages
   * Lista todas as mensagens customizáveis do sistema (Admin only)
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const messages = await SystemMessageModel.findAll();
      
      res.json({
        success: true,
        data: messages,
        total: messages.length
      });
    } catch (error) {
      console.error('Erro ao listar mensagens do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível listar as mensagens do sistema'
      });
    }
  }

  /**
   * GET /api/system-messages/:key
   * Busca uma mensagem específica por chave (Admin only)
   */
  static async getByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          success: false,
          error: 'Chave da mensagem é obrigatória'
        });
        return;
      }

      const message = await SystemMessageModel.findByKey(key);
      
      if (!message) {
        res.status(404).json({
          success: false,
          error: 'Mensagem não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Erro ao buscar mensagem do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar a mensagem'
      });
    }
  }

  /**
   * PUT /api/system-messages/:key
   * Atualiza o conteúdo de uma mensagem específica (Admin only)
   */
  static async updateByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { content } = req.body;

      if (!key) {
        res.status(400).json({
          success: false,
          error: 'Chave da mensagem é obrigatória'
        });
        return;
      }

      // Validação
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Conteúdo da mensagem é obrigatório'
        });
        return;
      }

      // Verificar se a mensagem existe
      const existingMessage = await SystemMessageModel.findByKey(key);
      if (!existingMessage) {
        res.status(404).json({
          success: false,
          error: 'Mensagem não encontrada'
        });
        return;
      }

      const updatedMessage = await SystemMessageModel.updateByKey(key, content.trim());

      res.json({
        success: true,
        data: updatedMessage,
        message: 'Mensagem atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar mensagem do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível atualizar a mensagem'
      });
    }
  }

  /**
   * POST /api/system-messages
   * Cria uma nova mensagem do sistema (Admin only)
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { message_key, content, description } = req.body;

      // Validação
      if (!message_key || typeof message_key !== 'string' || message_key.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Chave da mensagem é obrigatória'
        });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Conteúdo da mensagem é obrigatório'
        });
        return;
      }

      // Verificar se já existe uma mensagem com a mesma chave
      const existingMessage = await SystemMessageModel.findByKey(message_key.trim().toUpperCase());
      if (existingMessage) {
        res.status(409).json({
          success: false,
          error: 'Já existe uma mensagem com esta chave'
        });
        return;
      }

      const newMessage = await SystemMessageModel.create(
        message_key.trim().toUpperCase(),
        content.trim(),
        description?.trim()
      );

      res.status(201).json({
        success: true,
        data: newMessage,
        message: 'Mensagem criada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar mensagem do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível criar a mensagem'
      });
    }
  }

  /**
   * DELETE /api/system-messages/:key
   * Deleta uma mensagem do sistema (Admin only)
   */
  static async deleteByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(400).json({
          success: false,
          error: 'Chave da mensagem é obrigatória'
        });
        return;
      }

      // Verificar se a mensagem existe
      const existingMessage = await SystemMessageModel.findByKey(key);
      if (!existingMessage) {
        res.status(404).json({
          success: false,
          error: 'Mensagem não encontrada'
        });
        return;
      }

      await SystemMessageModel.delete(key);

      res.json({
        success: true,
        message: 'Mensagem excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir mensagem do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível excluir a mensagem'
      });
    }
  }

  /**
   * GET /api/system-messages/:key/content
   * Busca apenas o conteúdo de uma mensagem (usado pelo bot)
   */
  static async getContentByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          success: false,
          error: 'Chave da mensagem é obrigatória'
        });
        return;
      }

      const content = await SystemMessageModel.getMessageContent(key);
      
      if (!content) {
        res.status(404).json({
          success: false,
          error: 'Mensagem não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: { content }
      });
    } catch (error) {
      console.error('Erro ao buscar conteúdo da mensagem:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar o conteúdo da mensagem'
      });
    }
  }
}


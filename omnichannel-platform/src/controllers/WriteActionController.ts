import { Request, Response } from 'express';
import { WriteActionModel } from '../models/WriteAction';

export class WriteActionController {

  // GET /api/write-actions
  // Listar todas as ações de escrita (protegido - ADMIN)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { active_only } = req.query;
      const activeOnly = active_only === 'true';
      
      const writeActions = await WriteActionModel.findAll(activeOnly);
      
      res.json({
        success: true,
        data: writeActions
      });

    } catch (error) {
      console.error('Erro ao listar ações de escrita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível listar as ações de escrita'
      });
    }
  }

  // GET /api/write-actions/:id
  // Obter ação de escrita por ID (protegido - ADMIN)
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const writeAction = await WriteActionModel.findById(id);
      
      if (!writeAction) {
        res.status(404).json({
          success: false,
          error: 'Ação não encontrada',
          message: 'A ação de escrita especificada não foi encontrada'
        });
        return;
      }
      
      res.json({
        success: true,
        data: writeAction
      });

    } catch (error) {
      console.error('Erro ao buscar ação de escrita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar a ação de escrita'
      });
    }
  }

  // POST /api/write-actions
  // Criar nova ação de escrita (protegido - ADMIN)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, http_method, endpoint, request_body_template, is_active } = req.body;

      // Validações básicas
      if (!name || !http_method || !endpoint || !request_body_template) {
        res.status(400).json({
          success: false,
          error: 'Dados obrigatórios ausentes',
          message: 'Nome, método HTTP, endpoint e template do corpo são obrigatórios'
        });
        return;
      }

      // Validar método HTTP
      if (!['POST', 'PUT'].includes(http_method)) {
        res.status(400).json({
          success: false,
          error: 'Método HTTP inválido',
          message: 'Método HTTP deve ser POST ou PUT'
        });
        return;
      }

      // Validar template JSON
      const templateValidation = WriteActionModel.validateJsonTemplate(request_body_template);
      if (!templateValidation.valid) {
        res.status(400).json({
          success: false,
          error: 'Template JSON inválido',
          message: templateValidation.error
        });
        return;
      }

      const writeAction = await WriteActionModel.create({
        name,
        http_method,
        endpoint,
        request_body_template,
        is_active: is_active ?? true
      });

      res.status(201).json({
        success: true,
        data: writeAction,
        message: 'Ação de escrita criada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar ação de escrita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível criar a ação de escrita'
      });
    }
  }

  // PUT /api/write-actions/:id
  // Atualizar ação de escrita (protegido - ADMIN)
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, http_method, endpoint, request_body_template, is_active } = req.body;

      // Verificar se a ação existe
      const existingAction = await WriteActionModel.findById(id);
      if (!existingAction) {
        res.status(404).json({
          success: false,
          error: 'Ação não encontrada',
          message: 'A ação de escrita especificada não foi encontrada'
        });
        return;
      }

      // Validar método HTTP se fornecido
      if (http_method && !['POST', 'PUT'].includes(http_method)) {
        res.status(400).json({
          success: false,
          error: 'Método HTTP inválido',
          message: 'Método HTTP deve ser POST ou PUT'
        });
        return;
      }

      // Validar template JSON se fornecido
      if (request_body_template) {
        const templateValidation = WriteActionModel.validateJsonTemplate(request_body_template);
        if (!templateValidation.valid) {
          res.status(400).json({
            success: false,
            error: 'Template JSON inválido',
            message: templateValidation.error
          });
          return;
        }
      }

      const updatedAction = await WriteActionModel.update(id, {
        name,
        http_method,
        endpoint,
        request_body_template,
        is_active
      });

      res.json({
        success: true,
        data: updatedAction,
        message: 'Ação de escrita atualizada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao atualizar ação de escrita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível atualizar a ação de escrita'
      });
    }
  }

  // DELETE /api/write-actions/:id
  // Deletar ação de escrita (protegido - ADMIN)
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar se a ação existe
      const existingAction = await WriteActionModel.findById(id);
      if (!existingAction) {
        res.status(404).json({
          success: false,
          error: 'Ação não encontrada',
          message: 'A ação de escrita especificada não foi encontrada'
        });
        return;
      }

      const deleted = await WriteActionModel.delete(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Ação de escrita deletada com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao deletar',
          message: 'Não foi possível deletar a ação de escrita'
        });
      }

    } catch (error) {
      console.error('Erro ao deletar ação de escrita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível deletar a ação de escrita'
      });
    }
  }

  // POST /api/write-actions/:id/toggle
  // Ativar/Desativar ação de escrita (protegido - ADMIN)
  static async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar se a ação existe
      const existingAction = await WriteActionModel.findById(id);
      if (!existingAction) {
        res.status(404).json({
          success: false,
          error: 'Ação não encontrada',
          message: 'A ação de escrita especificada não foi encontrada'
        });
        return;
      }

      const updatedAction = await WriteActionModel.toggleActive(id);

      res.json({
        success: true,
        data: updatedAction,
        message: `Ação de escrita ${updatedAction?.is_active ? 'ativada' : 'desativada'} com sucesso`
      });

    } catch (error) {
      console.error('Erro ao alterar status da ação de escrita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível alterar o status da ação de escrita'
      });
    }
  }

  // GET /api/write-actions/:id/variables
  // Extrair variáveis do template (protegido - ADMIN)
  static async getVariables(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const writeAction = await WriteActionModel.findById(id);
      if (!writeAction) {
        res.status(404).json({
          success: false,
          error: 'Ação não encontrada',
          message: 'A ação de escrita especificada não foi encontrada'
        });
        return;
      }

      const variables = WriteActionModel.extractVariables(writeAction.request_body_template);

      res.json({
        success: true,
        data: {
          variables,
          template: writeAction.request_body_template
        }
      });

    } catch (error) {
      console.error('Erro ao extrair variáveis:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível extrair as variáveis do template'
      });
    }
  }

  // POST /api/write-actions/validate-template
  // Validar template JSON (protegido - ADMIN)
  static async validateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { template } = req.body;

      if (!template) {
        res.status(400).json({
          success: false,
          error: 'Template obrigatório',
          message: 'O template JSON é obrigatório'
        });
        return;
      }

      const validation = WriteActionModel.validateJsonTemplate(template);
      const variables = WriteActionModel.extractVariables(template);

      res.json({
        success: true,
        data: {
          valid: validation.valid,
          error: validation.error,
          variables
        }
      });

    } catch (error) {
      console.error('Erro ao validar template:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível validar o template'
      });
    }
  }
}


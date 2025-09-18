import { Request, Response } from 'express';
import { TeamModel, Team } from '../models';

export class TeamController {

  /**
   * GET /api/teams
   * Lista todas as equipes (Admin only)
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const teams = await TeamModel.findAll();
      
      res.json({
        success: true,
        data: teams,
        total: teams.length
      });
    } catch (error) {
      console.error('Erro ao listar equipes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível listar as equipes'
      });
    }
  }

  /**
   * GET /api/teams/:id
   * Busca uma equipe específica (Admin only)
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'ID da equipe é obrigatório'
        });
        return;
      }

      const team = await TeamModel.findById(id);
      
      if (!team) {
        res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível buscar a equipe'
      });
    }
  }

  /**
   * POST /api/teams
   * Cria uma nova equipe (Admin only)
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      // Validação
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Nome da equipe é obrigatório'
        });
        return;
      }

      // Verificar se já existe uma equipe com o mesmo nome
      const existingTeam = await TeamModel.findByName(name.trim());
      if (existingTeam) {
        res.status(409).json({
          success: false,
          error: 'Já existe uma equipe com este nome'
        });
        return;
      }

      const teamData: Omit<Team, 'id' | 'created_at'> = {
        name: name.trim()
      };

      const newTeam = await TeamModel.create(teamData);

      res.status(201).json({
        success: true,
        data: newTeam,
        message: 'Equipe criada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível criar a equipe'
      });
    }
  }

  /**
   * PUT /api/teams/:id
   * Atualiza uma equipe existente (Admin only)
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'ID da equipe é obrigatório'
        });
        return;
      }

      // Validação
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Nome da equipe é obrigatório'
        });
        return;
      }

      // Verificar se a equipe existe
      const existingTeam = await TeamModel.findById(id);
      if (!existingTeam) {
        res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
        return;
      }

      // Verificar se já existe outra equipe com o mesmo nome
      const teamWithSameName = await TeamModel.findByName(name.trim());
      if (teamWithSameName && teamWithSameName.id !== id) {
        res.status(409).json({
          success: false,
          error: 'Já existe uma equipe com este nome'
        });
        return;
      }

      const updateData: Partial<Team> = {
        name: name.trim()
      };

      const updatedTeam = await TeamModel.update(id, updateData);

      res.json({
        success: true,
        data: updatedTeam,
        message: 'Equipe atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível atualizar a equipe'
      });
    }
  }

  /**
   * DELETE /api/teams/:id
   * Exclui uma equipe (Admin only)
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'ID da equipe é obrigatório'
        });
        return;
      }

      // Verificar se a equipe existe
      const existingTeam = await TeamModel.findById(id);
      if (!existingTeam) {
        res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
        return;
      }

      // Verificar se há usuários associados à equipe
      const usersInTeam = await TeamModel.getUsersInTeam(id);
      if (usersInTeam.length > 0) {
        res.status(409).json({
          success: false,
          error: 'Não é possível excluir uma equipe que possui usuários associados',
          message: `Esta equipe possui ${usersInTeam.length} usuário(s) associado(s). Remova ou transfira os usuários antes de excluir a equipe.`
        });
        return;
      }

      await TeamModel.delete(id);

      res.json({
        success: true,
        message: 'Equipe excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível excluir a equipe'
      });
    }
  }

  /**
   * GET /api/teams/:id/users
   * Lista usuários de uma equipe específica (Admin only)
   */
  static async getTeamUsers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'ID da equipe é obrigatório'
        });
        return;
      }

      // Verificar se a equipe existe
      const team = await TeamModel.findById(id);
      if (!team) {
        res.status(404).json({
          success: false,
          error: 'Equipe não encontrada'
        });
        return;
      }

      const users = await TeamModel.getUsersInTeam(id);

      res.json({
        success: true,
        data: {
          team,
          users,
          total: users.length
        }
      });
    } catch (error) {
      console.error('Erro ao listar usuários da equipe:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível listar os usuários da equipe'
      });
    }
  }
}


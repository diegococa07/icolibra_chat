import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { PasswordUtils, ValidationUtils } from '../utils/auth';
import { PasswordGenerator } from '../utils/password';
import { UserRole } from '../types';

// Interfaces para requests
interface CreateUserRequest {
  fullName: string;
  email: string;
  role?: UserRole;
  team_id?: string;
}

interface UpdateUserRequest {
  fullName?: string;
  email?: string;
}

export class UserController {
  
  // GET /api/users
  // Listar todos os usuários AGENT e SUPERVISOR (apenas para ADMIN)
  static async listAgents(req: Request, res: Response): Promise<void> {
    try {
      // Buscar usuários com role AGENT e SUPERVISOR
      const agents = await UserModel.findByRole(UserRole.AGENT);
      const supervisors = await UserModel.findByRole(UserRole.SUPERVISOR);
      const allUsers = [...agents, ...supervisors];
      
      // Remover dados sensíveis da resposta
      const safeUsers = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        team_id: user.team_id,
        is_two_factor_enabled: user.is_two_factor_enabled,
        created_at: user.created_at
      }));

      res.status(200).json({
        message: 'Usuários listados com sucesso',
        users: safeUsers,
        total: safeUsers.length
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/users/:id
  // Buscar usuário específico por ID (apenas para ADMIN)
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID do usuário é obrigatório'
        });
        return;
      }

      const user = await UserModel.findById(id);
      
      if (!user) {
        res.status(404).json({
          error: 'Usuário não encontrado'
        });
        return;
      }

      // Remover dados sensíveis
      const safeUser = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_two_factor_enabled: user.is_two_factor_enabled,
        created_at: user.created_at
      };

      res.status(200).json({
        message: 'Usuário encontrado',
        user: safeUser
      });

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/users
  // Criar novo usuário (AGENT ou SUPERVISOR) (apenas para ADMIN)
  static async createAgent(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, role = UserRole.AGENT, team_id }: CreateUserRequest = req.body;

      // Validações básicas
      if (!fullName || !email) {
        res.status(400).json({
          error: 'Nome completo e email são obrigatórios'
        });
        return;
      }

      if (!ValidationUtils.isValidEmail(email)) {
        res.status(400).json({
          error: 'Email inválido'
        });
        return;
      }

      // Validar role
      if (role && !Object.values(UserRole).includes(role)) {
        res.status(400).json({
          error: 'Role inválido'
        });
        return;
      }

      // Se for SUPERVISOR, team_id é obrigatório
      if (role === UserRole.SUPERVISOR && !team_id) {
        res.status(400).json({
          error: 'Supervisores devem pertencer a uma equipe'
        });
        return;
      }

      // Verificar se email já existe
      const existingUser = await UserModel.findByEmail(ValidationUtils.sanitizeInput(email));
      if (existingUser) {
        res.status(400).json({
          error: 'Email já está em uso'
        });
        return;
      }

      // Gerar senha provisória
      const provisionalPassword = PasswordGenerator.generateSimplePassword(10);
      
      // Hash da senha provisória
      const hashedPassword = await PasswordUtils.hashPassword(provisionalPassword);

      // Criar usuário
      const newUser = await UserModel.create({
        email: ValidationUtils.sanitizeInput(email),
        full_name: fullName.trim(),
        encrypted_password: hashedPassword,
        role: role,
        team_id: team_id || undefined,
        is_two_factor_enabled: false
      });

      const roleLabel = role === UserRole.SUPERVISOR ? 'Supervisor' : 'Atendente';

      res.status(201).json({
        message: `${roleLabel} criado com sucesso`,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          is_two_factor_enabled: newUser.is_two_factor_enabled,
          created_at: newUser.created_at
        },
        provisionalPassword: provisionalPassword // Senha em texto plano para o admin
      });

    } catch (error) {
      console.error('Erro ao criar atendente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /api/users/:id
  // Atualizar usuário (apenas para ADMIN)
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, email }: UpdateUserRequest = req.body;

      if (!id) {
        res.status(400).json({
          error: 'ID do usuário é obrigatório'
        });
        return;
      }

      // Verificar se usuário existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          error: 'Usuário não encontrado'
        });
        return;
      }

      // Preparar dados para atualização
      const updateData: any = {};

      if (fullName !== undefined) {
        updateData.full_name = fullName.trim();
      }

      if (email !== undefined) {
        if (!ValidationUtils.isValidEmail(email)) {
          res.status(400).json({
            error: 'Email inválido'
          });
          return;
        }

        // Verificar se email já está em uso por outro usuário
        const emailUser = await UserModel.findByEmail(ValidationUtils.sanitizeInput(email));
        if (emailUser && emailUser.id !== id) {
          res.status(400).json({
            error: 'Email já está em uso por outro usuário'
          });
          return;
        }

        updateData.email = ValidationUtils.sanitizeInput(email);
      }

      // Se não há dados para atualizar
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: 'Nenhum dado válido fornecido para atualização'
        });
        return;
      }

      // Atualizar usuário
      const updatedUser = await UserModel.update(id, updateData);

      if (!updatedUser) {
        res.status(500).json({
          error: 'Erro ao atualizar usuário'
        });
        return;
      }

      res.status(200).json({
        message: 'Usuário atualizado com sucesso',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          is_two_factor_enabled: updatedUser.is_two_factor_enabled,
          created_at: updatedUser.created_at
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // DELETE /api/users/:id
  // Excluir usuário (apenas para ADMIN)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID do usuário é obrigatório'
        });
        return;
      }

      // Verificar se usuário existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          error: 'Usuário não encontrado'
        });
        return;
      }

      // Não permitir exclusão de ADMIN
      if (existingUser.role === UserRole.ADMIN) {
        res.status(403).json({
          error: 'Não é possível excluir usuários administradores'
        });
        return;
      }

      // Verificar se não é o próprio usuário logado
      if (req.user && req.user.userId === id) {
        res.status(403).json({
          error: 'Não é possível excluir sua própria conta'
        });
        return;
      }

      // Excluir usuário
      const deleted = await UserModel.delete(id);

      if (!deleted) {
        res.status(500).json({
          error: 'Erro ao excluir usuário'
        });
        return;
      }

      res.status(200).json({
        message: 'Usuário excluído com sucesso'
      });

    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/users/:id/reset-password
  // Redefinir senha de um usuário (apenas para ADMIN)
  static async resetUserPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'ID do usuário é obrigatório'
        });
        return;
      }

      // Verificar se usuário existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          error: 'Usuário não encontrado'
        });
        return;
      }

      // Gerar nova senha provisória
      const newPassword = PasswordGenerator.generateSimplePassword(10);
      
      // Hash da nova senha
      const hashedPassword = await PasswordUtils.hashPassword(newPassword);

      // Atualizar senha e desativar 2FA (usuário precisará reconfigurar)
      const updatedUser = await UserModel.update(id, {
        encrypted_password: hashedPassword
      });

      // Desativar 2FA
      await UserModel.toggleTwoFactor(id, false, undefined);

      if (!updatedUser) {
        res.status(500).json({
          error: 'Erro ao redefinir senha'
        });
        return;
      }

      res.status(200).json({
        message: 'Senha redefinida com sucesso',
        newPassword: newPassword, // Senha em texto plano para o admin
        note: '2FA foi desativado. O usuário precisará reconfigurar no próximo login.'
      });

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/users/stats
  // Estatísticas de usuários (apenas para ADMIN)
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UserModel.getStatsByRole();
      
      res.status(200).json({
        message: 'Estatísticas obtidas com sucesso',
        stats: stats
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/users/create-initial
  // Criar usuário inicial (apenas se não houver usuários no sistema)
  static async createInitialUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, full_name, role = 'ADMIN' } = req.body;

      // Validações básicas
      if (!email || !password) {
        res.status(400).json({
          error: 'Email e senha são obrigatórios'
        });
        return;
      }

      if (!ValidationUtils.isValidEmail(email)) {
        res.status(400).json({
          error: 'Email inválido'
        });
        return;
      }

      if (!ValidationUtils.isValidUserRole(role)) {
        res.status(400).json({
          error: 'Role inválida. Use ADMIN ou AGENT'
        });
        return;
      }

      // Validar força da senha
      const passwordValidation = PasswordUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Senha não atende aos critérios de segurança',
          details: passwordValidation.errors
        });
        return;
      }

      // Verificar se já existem usuários no sistema
      const existingUsers = await UserModel.findAll();
      if (existingUsers.length > 0) {
        res.status(400).json({
          error: 'Já existem usuários no sistema. Use o painel administrativo para criar novos usuários.'
        });
        return;
      }

      // Verificar se email já existe
      const existingUser = await UserModel.findByEmail(ValidationUtils.sanitizeInput(email));
      if (existingUser) {
        res.status(400).json({
          error: 'Email já está em uso'
        });
        return;
      }

      // Hash da senha
      const hashedPassword = await PasswordUtils.hashPassword(password);

      // Criar usuário
      const newUser = await UserModel.create({
        email: ValidationUtils.sanitizeInput(email),
        full_name: full_name?.trim(),
        encrypted_password: hashedPassword,
        role: role as UserRole,
        is_two_factor_enabled: false
      });

      res.status(201).json({
        message: 'Usuário inicial criado com sucesso',
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          is_two_factor_enabled: newUser.is_two_factor_enabled,
          created_at: newUser.created_at
        }
      });

    } catch (error) {
      console.error('Erro ao criar usuário inicial:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/users/check-initial
  // Verificar se precisa criar usuário inicial
  static async checkInitialSetup(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserModel.findAll();
      
      res.status(200).json({
        needsInitialSetup: users.length === 0,
        userCount: users.length
      });

    } catch (error) {
      console.error('Erro ao verificar setup inicial:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}


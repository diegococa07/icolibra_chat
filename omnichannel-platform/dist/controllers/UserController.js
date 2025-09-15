"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const User_1 = require("../models/User");
const auth_1 = require("../utils/auth");
const password_1 = require("../utils/password");
const types_1 = require("../types");
class UserController {
    // GET /api/users
    // Listar todos os usuários AGENT (apenas para ADMIN)
    static async listAgents(req, res) {
        try {
            // Buscar apenas usuários com role AGENT
            const agents = await User_1.UserModel.findByRole(types_1.UserRole.AGENT);
            // Remover dados sensíveis da resposta
            const safeAgents = agents.map(agent => ({
                id: agent.id,
                email: agent.email,
                full_name: agent.full_name,
                role: agent.role,
                is_two_factor_enabled: agent.is_two_factor_enabled,
                created_at: agent.created_at
            }));
            res.status(200).json({
                message: 'Atendentes listados com sucesso',
                users: safeAgents,
                total: safeAgents.length
            });
        }
        catch (error) {
            console.error('Erro ao listar atendentes:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/users/:id
    // Buscar usuário específico por ID (apenas para ADMIN)
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do usuário é obrigatório'
                });
                return;
            }
            const user = await User_1.UserModel.findById(id);
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
        }
        catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/users
    // Criar novo usuário AGENT (apenas para ADMIN)
    static async createAgent(req, res) {
        try {
            const { fullName, email } = req.body;
            // Validações básicas
            if (!fullName || !email) {
                res.status(400).json({
                    error: 'Nome completo e email são obrigatórios'
                });
                return;
            }
            if (!auth_1.ValidationUtils.isValidEmail(email)) {
                res.status(400).json({
                    error: 'Email inválido'
                });
                return;
            }
            // Verificar se email já existe
            const existingUser = await User_1.UserModel.findByEmail(auth_1.ValidationUtils.sanitizeInput(email));
            if (existingUser) {
                res.status(400).json({
                    error: 'Email já está em uso'
                });
                return;
            }
            // Gerar senha provisória
            const provisionalPassword = password_1.PasswordGenerator.generateSimplePassword(10);
            // Hash da senha provisória
            const hashedPassword = await auth_1.PasswordUtils.hashPassword(provisionalPassword);
            // Criar usuário
            const newUser = await User_1.UserModel.create({
                email: auth_1.ValidationUtils.sanitizeInput(email),
                full_name: fullName.trim(),
                encrypted_password: hashedPassword,
                role: types_1.UserRole.AGENT,
                is_two_factor_enabled: false
            });
            res.status(201).json({
                message: 'Atendente criado com sucesso',
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
        }
        catch (error) {
            console.error('Erro ao criar atendente:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // PUT /api/users/:id
    // Atualizar usuário (apenas para ADMIN)
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { fullName, email } = req.body;
            if (!id) {
                res.status(400).json({
                    error: 'ID do usuário é obrigatório'
                });
                return;
            }
            // Verificar se usuário existe
            const existingUser = await User_1.UserModel.findById(id);
            if (!existingUser) {
                res.status(404).json({
                    error: 'Usuário não encontrado'
                });
                return;
            }
            // Preparar dados para atualização
            const updateData = {};
            if (fullName !== undefined) {
                updateData.full_name = fullName.trim();
            }
            if (email !== undefined) {
                if (!auth_1.ValidationUtils.isValidEmail(email)) {
                    res.status(400).json({
                        error: 'Email inválido'
                    });
                    return;
                }
                // Verificar se email já está em uso por outro usuário
                const emailUser = await User_1.UserModel.findByEmail(auth_1.ValidationUtils.sanitizeInput(email));
                if (emailUser && emailUser.id !== id) {
                    res.status(400).json({
                        error: 'Email já está em uso por outro usuário'
                    });
                    return;
                }
                updateData.email = auth_1.ValidationUtils.sanitizeInput(email);
            }
            // Se não há dados para atualizar
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({
                    error: 'Nenhum dado válido fornecido para atualização'
                });
                return;
            }
            // Atualizar usuário
            const updatedUser = await User_1.UserModel.update(id, updateData);
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
        }
        catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // DELETE /api/users/:id
    // Excluir usuário (apenas para ADMIN)
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do usuário é obrigatório'
                });
                return;
            }
            // Verificar se usuário existe
            const existingUser = await User_1.UserModel.findById(id);
            if (!existingUser) {
                res.status(404).json({
                    error: 'Usuário não encontrado'
                });
                return;
            }
            // Não permitir exclusão de ADMIN
            if (existingUser.role === types_1.UserRole.ADMIN) {
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
            const deleted = await User_1.UserModel.delete(id);
            if (!deleted) {
                res.status(500).json({
                    error: 'Erro ao excluir usuário'
                });
                return;
            }
            res.status(200).json({
                message: 'Usuário excluído com sucesso'
            });
        }
        catch (error) {
            console.error('Erro ao excluir usuário:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/users/:id/reset-password
    // Redefinir senha de um usuário (apenas para ADMIN)
    static async resetUserPassword(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do usuário é obrigatório'
                });
                return;
            }
            // Verificar se usuário existe
            const existingUser = await User_1.UserModel.findById(id);
            if (!existingUser) {
                res.status(404).json({
                    error: 'Usuário não encontrado'
                });
                return;
            }
            // Gerar nova senha provisória
            const newPassword = password_1.PasswordGenerator.generateSimplePassword(10);
            // Hash da nova senha
            const hashedPassword = await auth_1.PasswordUtils.hashPassword(newPassword);
            // Atualizar senha e desativar 2FA (usuário precisará reconfigurar)
            const updatedUser = await User_1.UserModel.update(id, {
                encrypted_password: hashedPassword
            });
            // Desativar 2FA
            await User_1.UserModel.toggleTwoFactor(id, false, null);
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
        }
        catch (error) {
            console.error('Erro ao redefinir senha:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/users/stats
    // Estatísticas de usuários (apenas para ADMIN)
    static async getUserStats(req, res) {
        try {
            const stats = await User_1.UserModel.countByRole();
            res.status(200).json({
                message: 'Estatísticas obtidas com sucesso',
                stats: stats
            });
        }
        catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/users/create-initial
    // Criar usuário inicial (apenas se não houver usuários no sistema)
    static async createInitialUser(req, res) {
        try {
            const { email, password, full_name, role = 'ADMIN' } = req.body;
            // Validações básicas
            if (!email || !password) {
                res.status(400).json({
                    error: 'Email e senha são obrigatórios'
                });
                return;
            }
            if (!auth_1.ValidationUtils.isValidEmail(email)) {
                res.status(400).json({
                    error: 'Email inválido'
                });
                return;
            }
            if (!auth_1.ValidationUtils.isValidUserRole(role)) {
                res.status(400).json({
                    error: 'Role inválida. Use ADMIN ou AGENT'
                });
                return;
            }
            // Validar força da senha
            const passwordValidation = auth_1.PasswordUtils.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                res.status(400).json({
                    error: 'Senha não atende aos critérios de segurança',
                    details: passwordValidation.errors
                });
                return;
            }
            // Verificar se já existem usuários no sistema
            const existingUsers = await User_1.UserModel.findAll();
            if (existingUsers.length > 0) {
                res.status(400).json({
                    error: 'Já existem usuários no sistema. Use o painel administrativo para criar novos usuários.'
                });
                return;
            }
            // Verificar se email já existe
            const existingUser = await User_1.UserModel.findByEmail(auth_1.ValidationUtils.sanitizeInput(email));
            if (existingUser) {
                res.status(400).json({
                    error: 'Email já está em uso'
                });
                return;
            }
            // Hash da senha
            const hashedPassword = await auth_1.PasswordUtils.hashPassword(password);
            // Criar usuário
            const newUser = await User_1.UserModel.create({
                email: auth_1.ValidationUtils.sanitizeInput(email),
                full_name: full_name?.trim(),
                encrypted_password: hashedPassword,
                role: role,
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
        }
        catch (error) {
            console.error('Erro ao criar usuário inicial:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/users/check-initial
    // Verificar se precisa criar usuário inicial
    static async checkInitialSetup(req, res) {
        try {
            const users = await User_1.UserModel.findAll();
            res.status(200).json({
                needsInitialSetup: users.length === 0,
                userCount: users.length
            });
        }
        catch (error) {
            console.error('Erro ao verificar setup inicial:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map
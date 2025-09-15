"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const User_1 = require("../models/User");
const auth_1 = require("../utils/auth");
class AuthController {
    // POST /api/auth/login
    static async login(req, res) {
        try {
            const { email, password } = req.body;
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
            // Rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            const rateLimitKey = `login_${clientIP}_${email}`;
            const rateLimit = auth_1.SecurityUtils.checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
            if (!rateLimit.allowed) {
                res.status(429).json({
                    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
                    resetTime: rateLimit.resetTime
                });
                return;
            }
            // Buscar usuário
            const user = await User_1.UserModel.findByEmail(auth_1.ValidationUtils.sanitizeInput(email));
            if (!user) {
                res.status(401).json({
                    error: 'Credenciais inválidas'
                });
                return;
            }
            // Verificar senha
            const isPasswordValid = await auth_1.PasswordUtils.verifyPassword(password, user.encrypted_password);
            if (!isPasswordValid) {
                res.status(401).json({
                    error: 'Credenciais inválidas'
                });
                return;
            }
            // Verificar status do 2FA
            if (!user.is_two_factor_enabled) {
                // Primeiro login - precisa configurar 2FA
                const temporaryToken = auth_1.JWTUtils.generateTokenResponse(user, 'temporary');
                res.status(200).json({
                    message: 'Login realizado com sucesso. Configure o 2FA para continuar.',
                    requiresSetup2FA: true,
                    temporaryToken: temporaryToken.token,
                    expiresIn: temporaryToken.expiresIn,
                    user: temporaryToken.user
                });
                return;
            }
            // 2FA já configurado - precisa verificar
            res.status(200).json({
                message: 'Credenciais válidas. Insira o código 2FA para continuar.',
                requires2FA: true,
                userId: user.id
            });
        }
        catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/auth/2fa/generate
    static async generate2FA(req, res) {
        try {
            // Extrair token do header Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    error: 'Token de autorização necessário'
                });
                return;
            }
            const token = authHeader.substring(7);
            const payload = auth_1.JWTUtils.verifyToken(token);
            if (!payload || payload.type !== 'temporary') {
                res.status(401).json({
                    error: 'Token inválido ou expirado'
                });
                return;
            }
            // Buscar usuário
            const user = await User_1.UserModel.findById(payload.userId);
            if (!user) {
                res.status(404).json({
                    error: 'Usuário não encontrado'
                });
                return;
            }
            // Verificar se 2FA já está ativado
            if (user.is_two_factor_enabled) {
                res.status(400).json({
                    error: '2FA já está ativado para este usuário'
                });
                return;
            }
            // Gerar configuração 2FA
            const setup2FA = await auth_1.TwoFactorUtils.generate2FASetup(user.email);
            // Salvar segredo no banco (mas não ativar ainda)
            await User_1.UserModel.update(user.id, {
                two_factor_secret: setup2FA.secret
            });
            res.status(200).json({
                message: 'Configuração 2FA gerada com sucesso',
                qrCode: setup2FA.qrCodeDataURL,
                secret: setup2FA.secret, // Para backup manual
                authURL: setup2FA.authURL
            });
        }
        catch (error) {
            console.error('Erro ao gerar 2FA:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/auth/2fa/activate
    static async activate2FA(req, res) {
        try {
            const { token: twoFactorToken } = req.body;
            // Validações básicas
            if (!twoFactorToken) {
                res.status(400).json({
                    error: 'Token 2FA é obrigatório'
                });
                return;
            }
            if (!auth_1.ValidationUtils.isValid2FAToken(twoFactorToken)) {
                res.status(400).json({
                    error: 'Token 2FA deve conter 6 dígitos'
                });
                return;
            }
            // Extrair token do header Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    error: 'Token de autorização necessário'
                });
                return;
            }
            const jwtToken = authHeader.substring(7);
            const payload = auth_1.JWTUtils.verifyToken(jwtToken);
            if (!payload || payload.type !== 'temporary') {
                res.status(401).json({
                    error: 'Token inválido ou expirado'
                });
                return;
            }
            // Buscar usuário
            const user = await User_1.UserModel.findById(payload.userId);
            if (!user || !user.two_factor_secret) {
                res.status(404).json({
                    error: 'Usuário não encontrado ou 2FA não configurado'
                });
                return;
            }
            // Verificar token 2FA
            const isTokenValid = auth_1.TwoFactorUtils.verifyToken(twoFactorToken, user.two_factor_secret);
            if (!isTokenValid) {
                res.status(400).json({
                    error: 'Token 2FA inválido'
                });
                return;
            }
            // Ativar 2FA
            const updatedUser = await User_1.UserModel.toggleTwoFactor(user.id, true, user.two_factor_secret);
            if (!updatedUser) {
                res.status(500).json({
                    error: 'Erro ao ativar 2FA'
                });
                return;
            }
            // Gerar token completo
            const fullToken = auth_1.JWTUtils.generateTokenResponse(updatedUser, 'full');
            res.status(200).json({
                message: '2FA ativado com sucesso',
                token: fullToken.token,
                expiresIn: fullToken.expiresIn,
                user: fullToken.user
            });
        }
        catch (error) {
            console.error('Erro ao ativar 2FA:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/auth/2fa/verify
    static async verify2FA(req, res) {
        try {
            const { email, password, token: twoFactorToken } = req.body;
            // Validações básicas
            if (!email || !password || !twoFactorToken) {
                res.status(400).json({
                    error: 'Email, senha e token 2FA são obrigatórios'
                });
                return;
            }
            if (!auth_1.ValidationUtils.isValidEmail(email)) {
                res.status(400).json({
                    error: 'Email inválido'
                });
                return;
            }
            if (!auth_1.ValidationUtils.isValid2FAToken(twoFactorToken)) {
                res.status(400).json({
                    error: 'Token 2FA deve conter 6 dígitos'
                });
                return;
            }
            // Rate limiting
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            const rateLimitKey = `2fa_${clientIP}_${email}`;
            const rateLimit = auth_1.SecurityUtils.checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000);
            if (!rateLimit.allowed) {
                res.status(429).json({
                    error: 'Muitas tentativas de verificação 2FA. Tente novamente em 15 minutos.',
                    resetTime: rateLimit.resetTime
                });
                return;
            }
            // Buscar usuário
            const user = await User_1.UserModel.findByEmail(auth_1.ValidationUtils.sanitizeInput(email));
            if (!user) {
                res.status(401).json({
                    error: 'Credenciais inválidas'
                });
                return;
            }
            // Verificar senha
            const isPasswordValid = await auth_1.PasswordUtils.verifyPassword(password, user.encrypted_password);
            if (!isPasswordValid) {
                res.status(401).json({
                    error: 'Credenciais inválidas'
                });
                return;
            }
            // Verificar se 2FA está ativado
            if (!user.is_two_factor_enabled || !user.two_factor_secret) {
                res.status(400).json({
                    error: '2FA não está configurado para este usuário'
                });
                return;
            }
            // Verificar token 2FA
            const isTokenValid = auth_1.TwoFactorUtils.verifyToken(twoFactorToken, user.two_factor_secret);
            if (!isTokenValid) {
                res.status(400).json({
                    error: 'Token 2FA inválido'
                });
                return;
            }
            // Gerar token completo
            const fullToken = auth_1.JWTUtils.generateTokenResponse(user, 'full');
            res.status(200).json({
                message: 'Autenticação realizada com sucesso',
                token: fullToken.token,
                expiresIn: fullToken.expiresIn,
                user: fullToken.user
            });
        }
        catch (error) {
            console.error('Erro na verificação 2FA:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/auth/logout
    static async logout(req, res) {
        try {
            // Em uma implementação mais robusta, você poderia:
            // 1. Adicionar o token a uma blacklist
            // 2. Invalidar sessões no banco de dados
            // 3. Limpar cookies de sessão
            res.status(200).json({
                message: 'Logout realizado com sucesso'
            });
        }
        catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/auth/me
    static async getCurrentUser(req, res) {
        try {
            // Extrair token do header Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    error: 'Token de autorização necessário'
                });
                return;
            }
            const token = authHeader.substring(7);
            const payload = auth_1.JWTUtils.verifyToken(token);
            if (!payload || payload.type !== 'full') {
                res.status(401).json({
                    error: 'Token inválido ou não autorizado'
                });
                return;
            }
            // Buscar usuário atualizado
            const user = await User_1.UserModel.findById(payload.userId);
            if (!user) {
                res.status(404).json({
                    error: 'Usuário não encontrado'
                });
                return;
            }
            res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    is_two_factor_enabled: user.is_two_factor_enabled,
                    created_at: user.created_at
                }
            });
        }
        catch (error) {
            console.error('Erro ao buscar usuário atual:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/auth/refresh
    static async refreshToken(req, res) {
        try {
            // Extrair token do header Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    error: 'Token de autorização necessário'
                });
                return;
            }
            const token = authHeader.substring(7);
            const payload = auth_1.JWTUtils.verifyToken(token);
            if (!payload || payload.type !== 'full') {
                res.status(401).json({
                    error: 'Token inválido'
                });
                return;
            }
            // Buscar usuário
            const user = await User_1.UserModel.findById(payload.userId);
            if (!user) {
                res.status(404).json({
                    error: 'Usuário não encontrado'
                });
                return;
            }
            // Gerar novo token
            const newToken = auth_1.JWTUtils.generateTokenResponse(user, 'full');
            res.status(200).json({
                message: 'Token renovado com sucesso',
                token: newToken.token,
                expiresIn: newToken.expiresIn,
                user: newToken.user
            });
        }
        catch (error) {
            console.error('Erro ao renovar token:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map
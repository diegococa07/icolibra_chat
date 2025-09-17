"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuthenticatedAction = exports.optionalAuth = exports.requireOwnershipOrAdmin = exports.requireAdminOrAgent = exports.requireAgent = exports.requireAdmin = exports.requireRole = exports.requireTemporaryAuth = exports.requireFullAuth = exports.requireAuth = exports.authenticate = exports.AuthMiddleware = void 0;
const auth_1 = require("../utils/auth");
const types_1 = require("../types");
class AuthMiddleware {
    /**
     * Middleware para verificar se o usuário está autenticado
     * Aceita tanto tokens temporários quanto completos
     */
    static authenticate(req, res, next) {
        try {
            // Extrair token do header Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                const error = {
                    error: 'Token de autorização necessário',
                    code: 'MISSING_TOKEN',
                    timestamp: new Date().toISOString()
                };
                res.status(401).json(error);
                return;
            }
            const token = authHeader.substring(7);
            const payload = auth_1.JWTUtils.verifyToken(token);
            if (!payload) {
                const error = {
                    error: 'Token inválido ou expirado',
                    code: 'INVALID_TOKEN',
                    timestamp: new Date().toISOString()
                };
                res.status(401).json(error);
                return;
            }
            // Adicionar dados do usuário ao request
            req.user = payload;
            next();
        }
        catch (error) {
            console.error('Erro no middleware de autenticação:', error);
            const authError = {
                error: 'Erro interno de autenticação',
                code: 'AUTH_ERROR',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(authError);
        }
    }
    /**
     * Middleware para verificar se o usuário tem token completo (2FA verificado)
     */
    static requireFullAuth(req, res, next) {
        try {
            // Primeiro verificar se está autenticado
            AuthMiddleware.authenticate(req, res, () => {
                if (!req.user) {
                    return; // authenticate já enviou a resposta de erro
                }
                // Verificar se é token completo
                if (req.user.type !== 'full' || !req.user.is2FAVerified) {
                    const error = {
                        error: 'Acesso negado. Autenticação completa (2FA) necessária',
                        code: 'INCOMPLETE_AUTH',
                        timestamp: new Date().toISOString()
                    };
                    res.status(403).json(error);
                    return;
                }
                next();
            });
        }
        catch (error) {
            console.error('Erro no middleware de autenticação completa:', error);
            const authError = {
                error: 'Erro interno de autorização',
                code: 'AUTH_ERROR',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(authError);
        }
    }
    /**
     * Middleware para verificar se o usuário tem token temporário
     */
    static requireTemporaryAuth(req, res, next) {
        try {
            // Primeiro verificar se está autenticado
            AuthMiddleware.authenticate(req, res, () => {
                if (!req.user) {
                    return; // authenticate já enviou a resposta de erro
                }
                // Verificar se é token temporário
                if (req.user.type !== 'temporary') {
                    const error = {
                        error: 'Token temporário necessário para esta operação',
                        code: 'INVALID_TOKEN_TYPE',
                        timestamp: new Date().toISOString()
                    };
                    res.status(403).json(error);
                    return;
                }
                next();
            });
        }
        catch (error) {
            console.error('Erro no middleware de autenticação temporária:', error);
            const authError = {
                error: 'Erro interno de autorização',
                code: 'AUTH_ERROR',
                timestamp: new Date().toISOString()
            };
            res.status(500).json(authError);
        }
    }
    /**
     * Middleware para verificar role de usuário
     */
    static requireRole(allowedRoles) {
        return (req, res, next) => {
            try {
                // Primeiro verificar se tem autenticação completa
                AuthMiddleware.requireFullAuth(req, res, () => {
                    if (!req.user) {
                        return; // requireFullAuth já enviou a resposta de erro
                    }
                    const userRole = req.user.role;
                    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
                    if (!roles.includes(userRole)) {
                        const error = {
                            error: `Acesso negado. Role necessária: ${roles.join(' ou ')}`,
                            code: 'INSUFFICIENT_PERMISSIONS',
                            timestamp: new Date().toISOString()
                        };
                        res.status(403).json(error);
                        return;
                    }
                    next();
                });
            }
            catch (error) {
                console.error('Erro no middleware de role:', error);
                const authError = {
                    error: 'Erro interno de autorização',
                    code: 'AUTH_ERROR',
                    timestamp: new Date().toISOString()
                };
                res.status(500).json(authError);
            }
        };
    }
    /**
     * Middleware para verificar se o usuário é Admin
     */
    static requireAdmin(req, res, next) {
        AuthMiddleware.requireRole(types_1.UserRole.ADMIN)(req, res, next);
    }
    /**
     * Middleware para verificar se o usuário é Agent
     */
    static requireAgent(req, res, next) {
        AuthMiddleware.requireRole(types_1.UserRole.AGENT)(req, res, next);
    }
    /**
     * Middleware para verificar se o usuário é Admin ou Agent
     */
    static requireAdminOrAgent(req, res, next) {
        AuthMiddleware.requireRole([types_1.UserRole.ADMIN, types_1.UserRole.AGENT])(req, res, next);
    }
    /**
     * Middleware para verificar se o usuário pode acessar dados de outro usuário
     * Admins podem acessar qualquer usuário, Agents só podem acessar seus próprios dados
     */
    static requireOwnershipOrAdmin(userIdParam = 'userId') {
        return (req, res, next) => {
            try {
                // Primeiro verificar se tem autenticação completa
                AuthMiddleware.requireFullAuth(req, res, () => {
                    if (!req.user) {
                        return; // requireFullAuth já enviou a resposta de erro
                    }
                    const requestedUserId = req.params[userIdParam];
                    const currentUserId = req.user.userId;
                    const currentUserRole = req.user.role;
                    // Admin pode acessar qualquer usuário
                    if (currentUserRole === types_1.UserRole.ADMIN) {
                        next();
                        return;
                    }
                    // Agent só pode acessar seus próprios dados
                    if (currentUserId !== requestedUserId) {
                        const error = {
                            error: 'Acesso negado. Você só pode acessar seus próprios dados',
                            code: 'ACCESS_DENIED',
                            timestamp: new Date().toISOString()
                        };
                        res.status(403).json(error);
                        return;
                    }
                    next();
                });
            }
            catch (error) {
                console.error('Erro no middleware de ownership:', error);
                const authError = {
                    error: 'Erro interno de autorização',
                    code: 'AUTH_ERROR',
                    timestamp: new Date().toISOString()
                };
                res.status(500).json(authError);
            }
        };
    }
    /**
     * Middleware opcional de autenticação
     * Adiciona dados do usuário se o token for válido, mas não bloqueia se não houver token
     */
    static optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                // Sem token, continuar sem dados do usuário
                next();
                return;
            }
            const token = authHeader.substring(7);
            const payload = auth_1.JWTUtils.verifyToken(token);
            if (payload) {
                req.user = payload;
            }
            next();
        }
        catch (error) {
            console.error('Erro no middleware de autenticação opcional:', error);
            // Em caso de erro, continuar sem dados do usuário
            next();
        }
    }
    /**
     * Middleware para logging de ações autenticadas
     */
    static logAuthenticatedAction(req, res, next) {
        if (req.user) {
            console.log(`[${new Date().toISOString()}] Usuário ${req.user.email} (${req.user.role}) acessou ${req.method} ${req.path}`);
        }
        next();
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Exportar middlewares individuais para facilitar o uso
exports.authenticate = AuthMiddleware.authenticate;
exports.requireAuth = AuthMiddleware.requireFullAuth; // Alias para compatibilidade
exports.requireFullAuth = AuthMiddleware.requireFullAuth;
exports.requireTemporaryAuth = AuthMiddleware.requireTemporaryAuth;
exports.requireRole = AuthMiddleware.requireRole;
exports.requireAdmin = AuthMiddleware.requireAdmin;
exports.requireAgent = AuthMiddleware.requireAgent;
exports.requireAdminOrAgent = AuthMiddleware.requireAdminOrAgent;
exports.requireOwnershipOrAdmin = AuthMiddleware.requireOwnershipOrAdmin;
exports.optionalAuth = AuthMiddleware.optionalAuth;
exports.logAuthenticatedAction = AuthMiddleware.logAuthenticatedAction;
//# sourceMappingURL=auth.js.map
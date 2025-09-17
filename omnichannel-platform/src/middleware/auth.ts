import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/auth';
import { UserRole } from '../types';

// Estender interface Request para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Interface para resposta de erro
interface AuthError {
  error: string;
  code?: string;
  timestamp: string;
}

export class AuthMiddleware {
  
  /**
   * Middleware para verificar se o usuário está autenticado
   * Aceita tanto tokens temporários quanto completos
   */
  static authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error: AuthError = {
          error: 'Token de autorização necessário',
          code: 'MISSING_TOKEN',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(error);
        return;
      }

      const token = authHeader.substring(7);
      const payload = JWTUtils.verifyToken(token);

      if (!payload) {
        const error: AuthError = {
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

    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      const authError: AuthError = {
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
  static requireFullAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      // Primeiro verificar se está autenticado
      AuthMiddleware.authenticate(req, res, () => {
        if (!req.user) {
          return; // authenticate já enviou a resposta de erro
        }

        // Verificar se é token completo
        if (req.user.type !== 'full' || !req.user.is2FAVerified) {
          const error: AuthError = {
            error: 'Acesso negado. Autenticação completa (2FA) necessária',
            code: 'INCOMPLETE_AUTH',
            timestamp: new Date().toISOString()
          };
          res.status(403).json(error);
          return;
        }

        next();
      });

    } catch (error) {
      console.error('Erro no middleware de autenticação completa:', error);
      const authError: AuthError = {
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
  static requireTemporaryAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      // Primeiro verificar se está autenticado
      AuthMiddleware.authenticate(req, res, () => {
        if (!req.user) {
          return; // authenticate já enviou a resposta de erro
        }

        // Verificar se é token temporário
        if (req.user.type !== 'temporary') {
          const error: AuthError = {
            error: 'Token temporário necessário para esta operação',
            code: 'INVALID_TOKEN_TYPE',
            timestamp: new Date().toISOString()
          };
          res.status(403).json(error);
          return;
        }

        next();
      });

    } catch (error) {
      console.error('Erro no middleware de autenticação temporária:', error);
      const authError: AuthError = {
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
  static requireRole(allowedRoles: UserRole | UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Primeiro verificar se tem autenticação completa
        AuthMiddleware.requireFullAuth(req, res, () => {
          if (!req.user) {
            return; // requireFullAuth já enviou a resposta de erro
          }

          const userRole = req.user.role;
          const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

          if (!roles.includes(userRole)) {
            const error: AuthError = {
              error: `Acesso negado. Role necessária: ${roles.join(' ou ')}`,
              code: 'INSUFFICIENT_PERMISSIONS',
              timestamp: new Date().toISOString()
            };
            res.status(403).json(error);
            return;
          }

          next();
        });

      } catch (error) {
        console.error('Erro no middleware de role:', error);
        const authError: AuthError = {
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
  static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    AuthMiddleware.requireRole(UserRole.ADMIN)(req, res, next);
  }

  /**
   * Middleware para verificar se o usuário é Agent
   */
  static requireAgent(req: Request, res: Response, next: NextFunction): void {
    AuthMiddleware.requireRole(UserRole.AGENT)(req, res, next);
  }

  /**
   * Middleware para verificar se o usuário é Admin ou Agent
   */
  static requireAdminOrAgent(req: Request, res: Response, next: NextFunction): void {
    AuthMiddleware.requireRole([UserRole.ADMIN, UserRole.AGENT])(req, res, next);
  }

  /**
   * Middleware para verificar se o usuário pode acessar dados de outro usuário
   * Admins podem acessar qualquer usuário, Agents só podem acessar seus próprios dados
   */
  static requireOwnershipOrAdmin(userIdParam: string = 'userId') {
    return (req: Request, res: Response, next: NextFunction): void => {
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
          if (currentUserRole === UserRole.ADMIN) {
            next();
            return;
          }

          // Agent só pode acessar seus próprios dados
          if (currentUserId !== requestedUserId) {
            const error: AuthError = {
              error: 'Acesso negado. Você só pode acessar seus próprios dados',
              code: 'ACCESS_DENIED',
              timestamp: new Date().toISOString()
            };
            res.status(403).json(error);
            return;
          }

          next();
        });

      } catch (error) {
        console.error('Erro no middleware de ownership:', error);
        const authError: AuthError = {
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
  static optionalAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Sem token, continuar sem dados do usuário
        next();
        return;
      }

      const token = authHeader.substring(7);
      const payload = JWTUtils.verifyToken(token);

      if (payload) {
        req.user = payload;
      }

      next();

    } catch (error) {
      console.error('Erro no middleware de autenticação opcional:', error);
      // Em caso de erro, continuar sem dados do usuário
      next();
    }
  }

  /**
   * Middleware para logging de ações autenticadas
   */
  static logAuthenticatedAction(req: Request, res: Response, next: NextFunction): void {
    if (req.user) {
      console.log(`[${new Date().toISOString()}] Usuário ${req.user.email} (${req.user.role}) acessou ${req.method} ${req.path}`);
    }
    next();
  }
}

// Exportar middlewares individuais para facilitar o uso
export const authenticate = AuthMiddleware.authenticate;
export const requireAuth = AuthMiddleware.requireFullAuth; // Alias para compatibilidade
export const requireFullAuth = AuthMiddleware.requireFullAuth;
export const requireTemporaryAuth = AuthMiddleware.requireTemporaryAuth;
export const requireRole = AuthMiddleware.requireRole;
export const requireAdmin = AuthMiddleware.requireAdmin;
export const requireAgent = AuthMiddleware.requireAgent;
export const requireAdminOrAgent = AuthMiddleware.requireAdminOrAgent;
export const requireOwnershipOrAdmin = AuthMiddleware.requireOwnershipOrAdmin;
export const optionalAuth = AuthMiddleware.optionalAuth;
export const logAuthenticatedAction = AuthMiddleware.logAuthenticatedAction;


import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/auth';
import { UserRole } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare class AuthMiddleware {
    /**
     * Middleware para verificar se o usuário está autenticado
     * Aceita tanto tokens temporários quanto completos
     */
    static authenticate(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para verificar se o usuário tem token completo (2FA verificado)
     */
    static requireFullAuth(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para verificar se o usuário tem token temporário
     */
    static requireTemporaryAuth(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para verificar role de usuário
     */
    static requireRole(allowedRoles: UserRole | UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware para verificar se o usuário é Admin
     */
    static requireAdmin(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para verificar se o usuário é Agent
     */
    static requireAgent(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para verificar se o usuário é Admin ou Agent
     */
    static requireAdminOrAgent(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para verificar se o usuário pode acessar dados de outro usuário
     * Admins podem acessar qualquer usuário, Agents só podem acessar seus próprios dados
     */
    static requireOwnershipOrAdmin(userIdParam?: string): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware opcional de autenticação
     * Adiciona dados do usuário se o token for válido, mas não bloqueia se não houver token
     */
    static optionalAuth(req: Request, res: Response, next: NextFunction): void;
    /**
     * Middleware para logging de ações autenticadas
     */
    static logAuthenticatedAction(req: Request, res: Response, next: NextFunction): void;
}
export declare const authenticate: typeof AuthMiddleware.authenticate;
export declare const requireFullAuth: typeof AuthMiddleware.requireFullAuth;
export declare const requireTemporaryAuth: typeof AuthMiddleware.requireTemporaryAuth;
export declare const requireRole: typeof AuthMiddleware.requireRole;
export declare const requireAdmin: typeof AuthMiddleware.requireAdmin;
export declare const requireAgent: typeof AuthMiddleware.requireAgent;
export declare const requireAdminOrAgent: typeof AuthMiddleware.requireAdminOrAgent;
export declare const requireOwnershipOrAdmin: typeof AuthMiddleware.requireOwnershipOrAdmin;
export declare const optionalAuth: typeof AuthMiddleware.optionalAuth;
export declare const logAuthenticatedAction: typeof AuthMiddleware.logAuthenticatedAction;
//# sourceMappingURL=auth.d.ts.map
import { Request, Response } from 'express';
export declare class TeamController {
    /**
     * GET /api/teams
     * Lista todas as equipes (Admin only)
     */
    static list(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/teams/:id
     * Busca uma equipe específica (Admin only)
     */
    static getById(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/teams
     * Cria uma nova equipe (Admin only)
     */
    static create(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/teams/:id
     * Atualiza uma equipe existente (Admin only)
     */
    static update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/teams/:id
     * Exclui uma equipe (Admin only)
     */
    static delete(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/teams/:id/users
     * Lista usuários de uma equipe específica (Admin only)
     */
    static getTeamUsers(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=TeamController.d.ts.map
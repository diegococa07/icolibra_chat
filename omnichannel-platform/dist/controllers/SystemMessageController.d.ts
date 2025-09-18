import { Request, Response } from 'express';
export declare class SystemMessageController {
    /**
     * GET /api/system-messages
     * Lista todas as mensagens customizáveis do sistema (Admin only)
     */
    static list(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/system-messages/:key
     * Busca uma mensagem específica por chave (Admin only)
     */
    static getByKey(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/system-messages/:key
     * Atualiza o conteúdo de uma mensagem específica (Admin only)
     */
    static updateByKey(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/system-messages
     * Cria uma nova mensagem do sistema (Admin only)
     */
    static create(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/system-messages/:key
     * Deleta uma mensagem do sistema (Admin only)
     */
    static deleteByKey(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/system-messages/:key/content
     * Busca apenas o conteúdo de uma mensagem (usado pelo bot)
     */
    static getContentByKey(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=SystemMessageController.d.ts.map
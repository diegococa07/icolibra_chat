import { Request, Response } from 'express';
export declare class WriteActionController {
    static getAll(req: Request, res: Response): Promise<void>;
    static getById(req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static toggleActive(req: Request, res: Response): Promise<void>;
    static getVariables(req: Request, res: Response): Promise<void>;
    static validateTemplate(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=WriteActionController.d.ts.map
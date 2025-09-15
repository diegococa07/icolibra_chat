import { Request, Response } from 'express';
export declare class UserController {
    static listAgents(req: Request, res: Response): Promise<void>;
    static getUserById(req: Request, res: Response): Promise<void>;
    static createAgent(req: Request, res: Response): Promise<void>;
    static updateUser(req: Request, res: Response): Promise<void>;
    static deleteUser(req: Request, res: Response): Promise<void>;
    static resetUserPassword(req: Request, res: Response): Promise<void>;
    static getUserStats(req: Request, res: Response): Promise<void>;
    static createInitialUser(req: Request, res: Response): Promise<void>;
    static checkInitialSetup(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=UserController.d.ts.map
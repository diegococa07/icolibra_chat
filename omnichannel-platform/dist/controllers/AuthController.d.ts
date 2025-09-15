import { Request, Response } from 'express';
export declare class AuthController {
    static login(req: Request, res: Response): Promise<void>;
    static generate2FA(req: Request, res: Response): Promise<void>;
    static activate2FA(req: Request, res: Response): Promise<void>;
    static verify2FA(req: Request, res: Response): Promise<void>;
    static logout(req: Request, res: Response): Promise<void>;
    static getCurrentUser(req: Request, res: Response): Promise<void>;
    static refreshToken(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map
import { Request, Response } from 'express';
export declare class SettingsController {
    static getSettings(req: Request, res: Response): Promise<void>;
    static updateSettings(req: Request, res: Response): Promise<void>;
    static testConnection(req: Request, res: Response): Promise<void>;
    static getWebchatSnippet(req: Request, res: Response): Promise<void>;
    static regenerateSnippet(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=SettingsController.d.ts.map
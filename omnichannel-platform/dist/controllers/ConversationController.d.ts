import { Request, Response } from 'express';
export declare class ConversationController {
    static startConversation(req: Request, res: Response): Promise<void>;
    static sendMessage(req: Request, res: Response): Promise<void>;
    static getMessages(req: Request, res: Response): Promise<void>;
    static getConversations(req: Request, res: Response): Promise<void>;
    static assignConversation(req: Request, res: Response): Promise<void>;
    static closeConversation(req: Request, res: Response): Promise<void>;
    static getConversationStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ConversationController.d.ts.map
import { Request, Response } from 'express';
export declare class FlowController {
    static getFlows(req: Request, res: Response): Promise<void>;
    static getFlowById(req: Request, res: Response): Promise<void>;
    static createFlow(req: Request, res: Response): Promise<void>;
    static updateFlow(req: Request, res: Response): Promise<void>;
    static deleteFlow(req: Request, res: Response): Promise<void>;
    static publishFlow(req: Request, res: Response): Promise<void>;
    static unpublishFlow(req: Request, res: Response): Promise<void>;
    static getActiveFlow(req: Request, res: Response): Promise<void>;
    static getFlowStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=FlowController.d.ts.map
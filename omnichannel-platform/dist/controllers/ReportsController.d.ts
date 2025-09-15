import { Request, Response } from 'express';
export declare class ReportsController {
    static getSummary(req: Request, res: Response): Promise<void>;
    static getDetailed(req: Request, res: Response): Promise<void>;
    /**
     * Calcular datas de início e fim baseado no período solicitado
     */
    private static calculatePeriodDates;
    /**
     * Calcular métricas principais para o período
     */
    private static calculateMetrics;
    /**
     * Obter total de conversas encerradas no período
     */
    private static getTotalConversations;
    /**
     * Obter conversas agrupadas por canal
     */
    private static getConversationsByChannel;
    /**
     * Calcular eficiência da automação
     */
    private static getAutomationEfficiency;
    /**
     * Calcular métricas adicionais
     */
    private static getAdditionalMetrics;
    /**
     * Calcular breakdown diário para relatório detalhado
     */
    private static calculateDailyBreakdown;
    static exportData(req: Request, res: Response): Promise<void>;
    /**
     * Obter dados para exportação
     */
    private static getExportData;
    /**
     * Converter dados para formato CSV
     */
    private static convertToCSV;
}
//# sourceMappingURL=ReportsController.d.ts.map
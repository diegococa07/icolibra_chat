"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const connection_1 = require("../database/connection");
const Conversation_1 = require("../models/Conversation");
const User_1 = require("../models/User");
class ReportsController {
    // GET /api/reports/summary
    // Obter resumo de métricas para o período especificado (protegido - ADMIN)
    static async getSummary(req, res) {
        try {
            const { period = 'last7days' } = req.query;
            // Calcular datas baseado no período
            const periodFilter = ReportsController.calculatePeriodDates(period);
            if (!periodFilter) {
                res.status(400).json({
                    error: 'Período inválido. Use: last7days, last30days, last90days, thismonth, lastmonth'
                });
                return;
            }
            // Buscar métricas
            const summary = await ReportsController.calculateMetrics(periodFilter);
            res.status(200).json({
                message: 'Relatório gerado com sucesso',
                summary
            });
        }
        catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/reports/detailed
    // Obter relatório detalhado com breakdown por dia (protegido - ADMIN)
    static async getDetailed(req, res) {
        try {
            const { period = 'last7days' } = req.query;
            const periodFilter = ReportsController.calculatePeriodDates(period);
            if (!periodFilter) {
                res.status(400).json({
                    error: 'Período inválido'
                });
                return;
            }
            // Buscar dados detalhados por dia
            const dailyBreakdown = await ReportsController.calculateDailyBreakdown(periodFilter);
            res.status(200).json({
                message: 'Relatório detalhado gerado com sucesso',
                period: periodFilter.label,
                daily_breakdown: dailyBreakdown
            });
        }
        catch (error) {
            console.error('Erro ao gerar relatório detalhado:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    /**
     * Calcular datas de início e fim baseado no período solicitado
     */
    static calculatePeriodDates(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        switch (period) {
            case 'last7days':
                const last7Days = new Date(today);
                last7Days.setDate(today.getDate() - 7);
                return {
                    start_date: last7Days.toISOString(),
                    end_date: now.toISOString(),
                    label: 'Últimos 7 dias'
                };
            case 'last30days':
                const last30Days = new Date(today);
                last30Days.setDate(today.getDate() - 30);
                return {
                    start_date: last30Days.toISOString(),
                    end_date: now.toISOString(),
                    label: 'Últimos 30 dias'
                };
            case 'last90days':
                const last90Days = new Date(today);
                last90Days.setDate(today.getDate() - 90);
                return {
                    start_date: last90Days.toISOString(),
                    end_date: now.toISOString(),
                    label: 'Últimos 90 dias'
                };
            case 'thismonth':
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return {
                    start_date: thisMonthStart.toISOString(),
                    end_date: now.toISOString(),
                    label: 'Este mês'
                };
            case 'lastmonth':
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                return {
                    start_date: lastMonthStart.toISOString(),
                    end_date: lastMonthEnd.toISOString(),
                    label: 'Mês passado'
                };
            default:
                return null;
        }
    }
    /**
     * Calcular métricas principais para o período
     */
    static async calculateMetrics(periodFilter) {
        try {
            // 1. Total de conversas encerradas no período
            const totalConversations = await ReportsController.getTotalConversations(periodFilter);
            // 2. Conversas por canal
            const conversationsByChannel = await ReportsController.getConversationsByChannel(periodFilter);
            // 3. Eficiência da automação
            const automationEfficiency = await ReportsController.getAutomationEfficiency(periodFilter);
            // 4. Métricas adicionais
            const additionalMetrics = await ReportsController.getAdditionalMetrics(periodFilter);
            return {
                period: periodFilter.label,
                total_conversations: totalConversations,
                conversations_by_channel: conversationsByChannel,
                automation_efficiency: automationEfficiency,
                additional_metrics: additionalMetrics
            };
        }
        catch (error) {
            console.error('Erro ao calcular métricas:', error);
            throw error;
        }
    }
    /**
     * Obter total de conversas encerradas no período
     */
    static async getTotalConversations(periodFilter) {
        const result = await (0, connection_1.query)(`
      SELECT COUNT(*) as total
      FROM conversations 
      WHERE status = 'CLOSED' 
        AND closed_at >= $1 
        AND closed_at <= $2
    `, [periodFilter.start_date, periodFilter.end_date]);
        return parseInt(result.rows[0]?.total || '0');
    }
    /**
     * Obter conversas agrupadas por canal
     */
    static async getConversationsByChannel(periodFilter) {
        const result = await (0, connection_1.query)(`
      SELECT 
        c.type as channel_type,
        CASE 
          WHEN c.type = 'WEBCHAT' THEN 'Chat do Site'
          WHEN c.type = 'WHATSAPP' THEN 'WhatsApp'
          ELSE c.type
        END as channel_name,
        COUNT(conv.id) as count
      FROM conversations conv
      JOIN channels c ON conv.channel_id = c.id
      WHERE conv.status = 'CLOSED' 
        AND conv.closed_at >= $1 
        AND conv.closed_at <= $2
      GROUP BY c.type
      ORDER BY count DESC
    `, [periodFilter.start_date, periodFilter.end_date]);
        return result.rows.map(row => ({
            channel_type: row.channel_type,
            channel_name: row.channel_name,
            count: parseInt(row.count)
        }));
    }
    /**
     * Calcular eficiência da automação
     */
    static async getAutomationEfficiency(periodFilter) {
        // Conversas resolvidas apenas pelo bot (sem assignee_id)
        const botOnlyResult = await (0, connection_1.query)(`
      SELECT COUNT(*) as count
      FROM conversations 
      WHERE status = 'CLOSED' 
        AND closed_at >= $1 
        AND closed_at <= $2
        AND assignee_id IS NULL
    `, [periodFilter.start_date, periodFilter.end_date]);
        // Conversas com intervenção humana (com assignee_id)
        const humanInterventionResult = await (0, connection_1.query)(`
      SELECT COUNT(*) as count
      FROM conversations 
      WHERE status = 'CLOSED' 
        AND closed_at >= $1 
        AND closed_at <= $2
        AND assignee_id IS NOT NULL
    `, [periodFilter.start_date, periodFilter.end_date]);
        const resolvedByBot = parseInt(botOnlyResult.rows[0]?.count || '0');
        const withHumanIntervention = parseInt(humanInterventionResult.rows[0]?.count || '0');
        const total = resolvedByBot + withHumanIntervention;
        const botResolutionRate = total > 0 ? Math.round((resolvedByBot / total) * 100) : 0;
        return {
            resolved_by_bot: resolvedByBot,
            with_human_intervention: withHumanIntervention,
            bot_resolution_rate: botResolutionRate
        };
    }
    /**
     * Calcular métricas adicionais
     */
    static async getAdditionalMetrics(periodFilter) {
        // Média de mensagens por conversa
        const avgMessagesResult = await (0, connection_1.query)(`
      SELECT 
        ROUND(AVG(message_count), 1) as avg_messages
      FROM (
        SELECT 
          conv.id,
          COUNT(m.id) as message_count
        FROM conversations conv
        LEFT JOIN messages m ON conv.id = m.conversation_id
        WHERE conv.status = 'CLOSED' 
          AND conv.closed_at >= $1 
          AND conv.closed_at <= $2
        GROUP BY conv.id
      ) as conversation_stats
    `, [periodFilter.start_date, periodFilter.end_date]);
        // Conversas com protocolo registrado
        const protocolResult = await (0, connection_1.query)(`
      SELECT 
        COUNT(*) as total,
        COUNT(external_protocol) as with_protocol
      FROM conversations 
      WHERE status = 'CLOSED' 
        AND closed_at >= $1 
        AND closed_at <= $2
    `, [periodFilter.start_date, periodFilter.end_date]);
        const totalConversations = parseInt(protocolResult.rows[0]?.total || '0');
        const conversationsWithProtocol = parseInt(protocolResult.rows[0]?.with_protocol || '0');
        const protocolSuccessRate = totalConversations > 0 ?
            Math.round((conversationsWithProtocol / totalConversations) * 100) : 0;
        return {
            avg_messages_per_conversation: parseFloat(avgMessagesResult.rows[0]?.avg_messages || '0'),
            conversations_with_protocol: conversationsWithProtocol,
            protocol_success_rate: protocolSuccessRate
        };
    }
    /**
     * Calcular breakdown diário para relatório detalhado
     */
    static async calculateDailyBreakdown(periodFilter) {
        const result = await (0, connection_1.query)(`
      SELECT 
        DATE(closed_at) as date,
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN assignee_id IS NULL THEN 1 END) as bot_resolved,
        COUNT(CASE WHEN assignee_id IS NOT NULL THEN 1 END) as human_resolved,
        COUNT(external_protocol) as with_protocol
      FROM conversations 
      WHERE status = 'CLOSED' 
        AND closed_at >= $1 
        AND closed_at <= $2
      GROUP BY DATE(closed_at)
      ORDER BY date DESC
    `, [periodFilter.start_date, periodFilter.end_date]);
        return result.rows.map(row => ({
            date: row.date,
            total_conversations: parseInt(row.total_conversations),
            bot_resolved: parseInt(row.bot_resolved),
            human_resolved: parseInt(row.human_resolved),
            with_protocol: parseInt(row.with_protocol),
            bot_resolution_rate: row.total_conversations > 0 ?
                Math.round((row.bot_resolved / row.total_conversations) * 100) : 0
        }));
    }
    // GET /api/reports/export
    // Exportar dados para CSV (protegido - ADMIN)
    static async exportData(req, res) {
        try {
            const { period = 'last30days', format = 'json' } = req.query;
            const periodFilter = ReportsController.calculatePeriodDates(period);
            if (!periodFilter) {
                res.status(400).json({
                    error: 'Período inválido'
                });
                return;
            }
            // Buscar dados detalhados para exportação
            const exportData = await ReportsController.getExportData(periodFilter);
            if (format === 'csv') {
                // Converter para CSV
                const csv = ReportsController.convertToCSV(exportData);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="relatorio-${period}.csv"`);
                res.send(csv);
            }
            else {
                // Retornar JSON
                res.status(200).json({
                    message: 'Dados exportados com sucesso',
                    period: periodFilter.label,
                    data: exportData
                });
            }
        }
        catch (error) {
            console.error('Erro ao exportar dados:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    /**
     * Obter dados para exportação
     */
    static async getExportData(periodFilter) {
        const result = await (0, connection_1.query)(`
      SELECT 
        conv.id,
        conv.customer_identifier,
        c.type as channel_type,
        conv.status,
        conv.queue,
        conv.external_protocol,
        CASE WHEN conv.assignee_id IS NULL THEN 'Bot' ELSE 'Humano' END as resolution_type,
        u.name as assignee_name,
        conv.created_at,
        conv.closed_at,
        COUNT(m.id) as total_messages
      FROM conversations conv
      JOIN channels c ON conv.channel_id = c.id
      LEFT JOIN users u ON conv.assignee_id = u.id
      LEFT JOIN messages m ON conv.id = m.conversation_id
      WHERE conv.status = 'CLOSED' 
        AND conv.closed_at >= $1 
        AND conv.closed_at <= $2
      GROUP BY conv.id, c.type, u.name
      ORDER BY conv.closed_at DESC
    `, [periodFilter.start_date, periodFilter.end_date]);
        return result.rows;
    }
    /**
     * Converter dados para CSV
     */
    static convertToCSV(data) {
        if (!data || data.length === 0) {
            return '';
        }
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','));
        return [csvHeaders, ...csvRows].join('\n');
    }
    // GET /api/reports/performance
    // Obter relatórios de performance (TMA e TMR) (protegido - ADMIN e SUPERVISOR)
    static async getPerformance(req, res) {
        try {
            const { period = 'last30days', team_id } = req.query;
            const currentUser = req.user;
            let teamMemberIds;
            // Se for supervisor, filtrar apenas sua equipe
            if (currentUser.role === 'SUPERVISOR') {
                const supervisorTeamId = await User_1.UserModel.getSupervisorTeamId(currentUser.userId);
                if (supervisorTeamId) {
                    const teamMembers = await User_1.UserModel.findByTeamId(supervisorTeamId);
                    teamMemberIds = teamMembers.map(member => member.id);
                }
                else {
                    teamMemberIds = []; // Se supervisor não tem equipe, não mostrar dados
                }
            }
            else if (team_id && typeof team_id === 'string') {
                // Se admin especificou uma equipe específica
                const teamMembers = await User_1.UserModel.findByTeamId(team_id);
                teamMemberIds = teamMembers.map(member => member.id);
            }
            // Calcular TMA (Tempo Médio de Atendimento)
            const tmaSeconds = await Conversation_1.ConversationModel.calculateTMA(period, teamMemberIds);
            const tmaFormatted = tmaSeconds ? Conversation_1.ConversationModel.formatTime(tmaSeconds) : null;
            // Calcular TMR (Tempo de Primeira Resposta)
            const tmrSeconds = await Conversation_1.ConversationModel.calculateTMR(period, teamMemberIds);
            const tmrFormatted = tmrSeconds ? Conversation_1.ConversationModel.formatTime(tmrSeconds) : null;
            // Calcular período para contexto
            const periodFilter = ReportsController.calculatePeriodDates(period);
            res.json({
                success: true,
                data: {
                    period: {
                        label: periodFilter?.label || period,
                        start_date: periodFilter?.start_date,
                        end_date: periodFilter?.end_date
                    },
                    performance_metrics: {
                        tma: {
                            seconds: tmaSeconds,
                            formatted: tmaFormatted,
                            description: 'Tempo Médio de Atendimento (do início ao fechamento da conversa)'
                        },
                        tmr: {
                            seconds: tmrSeconds,
                            formatted: tmrFormatted,
                            description: 'Tempo de Primeira Resposta (do início até a primeira resposta do atendente)'
                        }
                    },
                    team_filter: team_id ? { team_id } : null
                }
            });
        }
        catch (error) {
            console.error('Erro ao obter relatórios de performance:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                message: 'Não foi possível obter os relatórios de performance'
            });
        }
    }
}
exports.ReportsController = ReportsController;
//# sourceMappingURL=ReportsController.js.map
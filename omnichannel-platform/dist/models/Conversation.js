"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class ConversationModel {
    // Criar uma nova conversa
    static async create(conversationData) {
        const id = (0, uuid_1.v4)();
        const { customer_identifier, channel_id, status, assignee_id, queue, external_protocol } = conversationData;
        const sql = `
      INSERT INTO conversations (id, customer_identifier, channel_id, status, assignee_id, queue, external_protocol)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
        const values = [id, customer_identifier, channel_id, status, assignee_id, queue, external_protocol];
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0];
    }
    // Buscar conversa por ID
    static async findById(id) {
        const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.id = $1
    `;
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Buscar conversas por identificador do cliente
    static async findByCustomer(customerIdentifier) {
        const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.customer_identifier = $1
      ORDER BY c.created_at DESC
    `;
        const result = await (0, connection_1.query)(sql, [customerIdentifier]);
        return result.rows;
    }
    // Buscar conversas por status
    static async findByStatus(status) {
        const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.status = $1
      ORDER BY c.created_at DESC
    `;
        const result = await (0, connection_1.query)(sql, [status]);
        return result.rows;
    }
    // Buscar conversas atribuídas a um atendente
    static async findByAssignee(assigneeId) {
        const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.assignee_id = $1
      ORDER BY c.created_at DESC
    `;
        const result = await (0, connection_1.query)(sql, [assigneeId]);
        return result.rows;
    }
    // Buscar conversas por fila
    static async findByQueue(queue) {
        const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.queue = $1
      ORDER BY c.created_at DESC
    `;
        const result = await (0, connection_1.query)(sql, [queue]);
        return result.rows;
    }
    // Listar todas as conversas com paginação
    static async findAll(limit = 50, offset = 0) {
        // Query para contar total
        const countSql = 'SELECT COUNT(*) as total FROM conversations';
        const countResult = await (0, connection_1.query)(countSql);
        const total = parseInt(countResult.rows[0].total);
        // Query para buscar conversas
        const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `;
        const result = await (0, connection_1.query)(sql, [limit, offset]);
        return {
            conversations: result.rows,
            total
        };
    }
    // Atualizar conversa
    static async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        // Construir query dinamicamente baseada nos campos fornecidos
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        if (fields.length === 0) {
            throw new Error('Nenhum campo para atualizar foi fornecido');
        }
        values.push(id); // ID sempre é o último parâmetro
        const sql = `
      UPDATE conversations 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0] || null;
    }
    // Atribuir conversa a um atendente
    static async assignToAgent(id, assigneeId) {
        const sql = `
      UPDATE conversations 
      SET assignee_id = $1, status = 'OPEN'
      WHERE id = $2
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [assigneeId, id]);
        return result.rows[0] || null;
    }
    // Fechar conversa
    static async close(id) {
        const sql = `
      UPDATE conversations 
      SET status = 'CLOSED', closed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Reabrir conversa
    static async reopen(id) {
        const sql = `
      UPDATE conversations 
      SET status = 'QUEUED', closed_at = NULL
      WHERE id = $1
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Transferir para fila
    static async transferToQueue(id, queue) {
        const sql = `
      UPDATE conversations 
      SET queue = $1, status = 'QUEUED', assignee_id = NULL
      WHERE id = $2
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [queue, id]);
        return result.rows[0] || null;
    }
    // Deletar conversa
    static async delete(id) {
        const sql = 'DELETE FROM conversations WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rowCount > 0;
    }
    // Estatísticas de conversas
    static async getStats() {
        // Total de conversas
        const totalSql = 'SELECT COUNT(*) as total FROM conversations';
        const totalResult = await (0, connection_1.query)(totalSql);
        const total = parseInt(totalResult.rows[0].total);
        // Por status
        const statusSql = `
      SELECT status, COUNT(*) as count 
      FROM conversations 
      GROUP BY status
    `;
        const statusResult = await (0, connection_1.query)(statusSql);
        const byStatus = statusResult.rows.map(row => ({
            status: row.status,
            count: parseInt(row.count)
        }));
        // Por canal
        const channelSql = `
      SELECT ch.type as channel_type, COUNT(*) as count 
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      GROUP BY ch.type
    `;
        const channelResult = await (0, connection_1.query)(channelSql);
        const byChannel = channelResult.rows.map(row => ({
            channel_type: row.channel_type,
            count: parseInt(row.count)
        }));
        // Tempo médio de resposta (em minutos)
        const avgTimeSql = `
      SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/60) as avg_minutes
      FROM conversations 
      WHERE closed_at IS NOT NULL
    `;
        const avgTimeResult = await (0, connection_1.query)(avgTimeSql);
        const avgResponseTime = parseFloat(avgTimeResult.rows[0].avg_minutes) || 0;
        return {
            total,
            byStatus,
            byChannel,
            avgResponseTime
        };
    }
}
exports.ConversationModel = ConversationModel;
//# sourceMappingURL=Conversation.js.map
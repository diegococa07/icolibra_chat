import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Conversation, CreateConversation, ConversationStatus } from '../types';

export class ConversationModel {
  
  // Criar uma nova conversa
  static async create(conversationData: CreateConversation): Promise<Conversation> {
    const id = uuidv4();
    const {
      customer_identifier,
      channel_id,
      status,
      assignee_id,
      queue,
      external_protocol
    } = conversationData;

    const sql = `
      INSERT INTO conversations (id, customer_identifier, channel_id, status, assignee_id, queue, external_protocol)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [id, customer_identifier, channel_id, status, assignee_id, queue, external_protocol];
    const result = await query(sql, values);
    
    return result.rows[0];
  }

  // Buscar conversa por ID
  static async findById(id: string): Promise<Conversation | null> {
    const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.id = $1
    `;
    const result = await query(sql, [id]);
    
    return result.rows[0] || null;
  }

  // Buscar conversas por identificador do cliente
  static async findByCustomer(customerIdentifier: string): Promise<Conversation[]> {
    const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.customer_identifier = $1
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql, [customerIdentifier]);
    
    return result.rows;
  }

  // Buscar conversas por status
  static async findByStatus(status: ConversationStatus): Promise<Conversation[]> {
    const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.status = $1
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql, [status]);
    
    return result.rows;
  }

  // Buscar conversas atribuídas a um atendente
  static async findByAssignee(assigneeId: string): Promise<Conversation[]> {
    const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.assignee_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql, [assigneeId]);
    
    return result.rows;
  }

  // Buscar conversas por fila
  static async findByQueue(queue: string): Promise<Conversation[]> {
    const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE c.queue = $1
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql, [queue]);
    
    return result.rows;
  }

  // Listar todas as conversas com paginação e filtros
  static async findAll(
    filters: any = {}, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Conversation[]> {
    
    // Construir WHERE clause dinamicamente
    const whereConditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      whereConditions.push(`c.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    if (filters.queue) {
      whereConditions.push(`c.queue = $${paramCount}`);
      values.push(filters.queue);
      paramCount++;
    }

    if (filters.assignee_id_in && Array.isArray(filters.assignee_id_in)) {
      if (filters.assignee_id_in.length > 0) {
        const placeholders = filters.assignee_id_in.map(() => `$${paramCount++}`).join(',');
        whereConditions.push(`c.assignee_id IN (${placeholders})`);
        values.push(...filters.assignee_id_in);
      } else {
        // Se array vazio, não retornar nenhuma conversa
        whereConditions.push('1 = 0');
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query para buscar conversas
    const sql = `
      SELECT c.*, ch.type as channel_type, u.full_name as assignee_name
      FROM conversations c
      LEFT JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    values.push(limit, offset);
    const result = await query(sql, values);
    
    return result.rows;
  }

  // Atualizar conversa
  static async update(id: string, updateData: Partial<CreateConversation>): Promise<Conversation | null> {
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

    const result = await query(sql, values);
    
    return result.rows[0] || null;
  }

  // Atribuir conversa a um atendente
  static async assignToAgent(id: string, assigneeId: string): Promise<Conversation | null> {
    const sql = `
      UPDATE conversations 
      SET assignee_id = $1, status = 'OPEN'
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [assigneeId, id]);
    
    return result.rows[0] || null;
  }

  // Fechar conversa
  static async close(id: string): Promise<Conversation | null> {
    const sql = `
      UPDATE conversations 
      SET status = 'CLOSED', closed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    
    return result.rows[0] || null;
  }

  // Reabrir conversa
  static async reopen(id: string): Promise<Conversation | null> {
    const sql = `
      UPDATE conversations 
      SET status = 'QUEUED', closed_at = NULL
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    
    return result.rows[0] || null;
  }

  // Transferir para fila
  static async transferToQueue(id: string, queue: string): Promise<Conversation | null> {
    const sql = `
      UPDATE conversations 
      SET queue = $1, status = 'QUEUED', assignee_id = NULL
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [queue, id]);
    
    return result.rows[0] || null;
  }

  // Deletar conversa
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM conversations WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rowCount > 0;
  }

  // Estatísticas de conversas
  static async getStats(): Promise<{
    total: number;
    byStatus: { status: ConversationStatus; count: number }[];
    byChannel: { channel_type: string; count: number }[];
    avgResponseTime: number;
  }> {
    // Total de conversas
    const totalSql = 'SELECT COUNT(*) as total FROM conversations';
    const totalResult = await query(totalSql);
    const total = parseInt(totalResult.rows[0].total);

    // Por status
    const statusSql = `
      SELECT status, COUNT(*) as count 
      FROM conversations 
      GROUP BY status
    `;
    const statusResult = await query(statusSql);
    const byStatus = statusResult.rows.map(row => ({
      status: row.status as ConversationStatus,
      count: parseInt(row.count)
    }));

    // Por canal
    const channelSql = `
      SELECT ch.type as channel_type, COUNT(*) as count 
      FROM conversations c
      JOIN channels ch ON c.channel_id = ch.id
      GROUP BY ch.type
    `;
    const channelResult = await query(channelSql);
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
    const avgTimeResult = await query(avgTimeSql);
    const avgResponseTime = parseFloat(avgTimeResult.rows[0].avg_minutes) || 0;

    return {
      total,
      byStatus,
      byChannel,
      avgResponseTime
    };
  }

  // Calcular Tempo Médio de Atendimento (TMA)
  static async calculateTMA(
    period: string = 'last30days',
    teamMemberIds?: string[]
  ): Promise<number | null> {
    let whereClause = "WHERE c.closed_at IS NOT NULL";
    const values: any[] = [];
    let paramCount = 1;

    // Filtro de período
    const periodDays = ConversationModel.getPeriodDays(period);
    if (periodDays > 0) {
      whereClause += ` AND c.closed_at >= NOW() - INTERVAL '${periodDays} days'`;
    }

    // Filtro por equipe (para supervisores)
    if (teamMemberIds && teamMemberIds.length > 0) {
      const placeholders = teamMemberIds.map(() => `$${paramCount++}`).join(',');
      whereClause += ` AND c.assignee_id IN (${placeholders})`;
      values.push(...teamMemberIds);
    }

    const sql = `
      SELECT AVG(EXTRACT(EPOCH FROM (c.closed_at - c.created_at))) as avg_seconds
      FROM conversations c
      ${whereClause}
    `;

    const result = await query(sql, values);
    const avgSeconds = result.rows[0]?.avg_seconds;
    
    return avgSeconds ? parseFloat(avgSeconds) : null;
  }

  // Calcular Tempo de Primeira Resposta (TMR)
  static async calculateTMR(
    period: string = 'last30days',
    teamMemberIds?: string[]
  ): Promise<number | null> {
    let whereClause = "WHERE c.first_agent_response_at IS NOT NULL";
    const values: any[] = [];
    let paramCount = 1;

    // Filtro de período
    const periodDays = ConversationModel.getPeriodDays(period);
    if (periodDays > 0) {
      whereClause += ` AND c.first_agent_response_at >= NOW() - INTERVAL '${periodDays} days'`;
    }

    // Filtro por equipe (para supervisores)
    if (teamMemberIds && teamMemberIds.length > 0) {
      const placeholders = teamMemberIds.map(() => `$${paramCount++}`).join(',');
      whereClause += ` AND c.assignee_id IN (${placeholders})`;
      values.push(...teamMemberIds);
    }

    const sql = `
      SELECT AVG(EXTRACT(EPOCH FROM (c.first_agent_response_at - c.created_at))) as avg_seconds
      FROM conversations c
      ${whereClause}
    `;

    const result = await query(sql, values);
    const avgSeconds = result.rows[0]?.avg_seconds;
    
    return avgSeconds ? parseFloat(avgSeconds) : null;
  }

  // Converter período em dias
  static getPeriodDays(period: string): number {
    switch (period) {
      case 'today':
        return 1;
      case 'last7days':
        return 7;
      case 'last30days':
        return 30;
      case 'last90days':
        return 90;
      default:
        return 30; // padrão
    }
  }

  // Formatar tempo em segundos para formato legível
  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }
}


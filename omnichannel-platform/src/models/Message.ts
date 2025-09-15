import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Message, CreateMessage, SenderType } from '../types';

export class MessageModel {
  
  // Criar uma nova mensagem
  static async create(messageData: CreateMessage): Promise<Message> {
    const id = uuidv4();
    const {
      conversation_id,
      sender_type,
      sender_id,
      content_type = 'text',
      content
    } = messageData;

    const sql = `
      INSERT INTO messages (id, conversation_id, sender_type, sender_id, content_type, content)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [id, conversation_id, sender_type, sender_id, content_type, content];
    const result = await query(sql, values);
    
    return result.rows[0];
  }

  // Buscar mensagem por ID
  static async findById(id: string): Promise<Message | null> {
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `;
    const result = await query(sql, [id]);
    
    return result.rows[0] || null;
  }

  // Buscar mensagens por conversa
  static async findByConversation(conversationId: string, limit: number = 100, offset: number = 0): Promise<{
    messages: Message[];
    total: number;
  }> {
    // Query para contar total
    const countSql = 'SELECT COUNT(*) as total FROM messages WHERE conversation_id = $1';
    const countResult = await query(countSql, [conversationId]);
    const total = parseInt(countResult.rows[0].total);

    // Query para buscar mensagens
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [conversationId, limit, offset]);
    
    return {
      messages: result.rows,
      total
    };
  }

  // Buscar mensagens por tipo de remetente
  static async findBySenderType(senderType: SenderType, limit: number = 50, offset: number = 0): Promise<{
    messages: Message[];
    total: number;
  }> {
    // Query para contar total
    const countSql = 'SELECT COUNT(*) as total FROM messages WHERE sender_type = $1';
    const countResult = await query(countSql, [senderType]);
    const total = parseInt(countResult.rows[0].total);

    // Query para buscar mensagens
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.sender_type = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [senderType, limit, offset]);
    
    return {
      messages: result.rows,
      total
    };
  }

  // Buscar mensagens de um atendente específico
  static async findByAgent(agentId: string, limit: number = 50, offset: number = 0): Promise<{
    messages: Message[];
    total: number;
  }> {
    // Query para contar total
    const countSql = 'SELECT COUNT(*) as total FROM messages WHERE sender_id = $1 AND sender_type = \'AGENT\'';
    const countResult = await query(countSql, [agentId]);
    const total = parseInt(countResult.rows[0].total);

    // Query para buscar mensagens
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.sender_id = $1 AND m.sender_type = 'AGENT'
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [agentId, limit, offset]);
    
    return {
      messages: result.rows,
      total
    };
  }

  // Buscar últimas mensagens de uma conversa
  static async findLatestByConversation(conversationId: string, limit: number = 10): Promise<Message[]> {
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2
    `;
    const result = await query(sql, [conversationId, limit]);
    
    return result.rows.reverse(); // Reverter para ordem cronológica
  }

  // Buscar mensagens por tipo de conteúdo
  static async findByContentType(contentType: string, limit: number = 50, offset: number = 0): Promise<{
    messages: Message[];
    total: number;
  }> {
    // Query para contar total
    const countSql = 'SELECT COUNT(*) as total FROM messages WHERE content_type = $1';
    const countResult = await query(countSql, [contentType]);
    const total = parseInt(countResult.rows[0].total);

    // Query para buscar mensagens
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.content_type = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [contentType, limit, offset]);
    
    return {
      messages: result.rows,
      total
    };
  }

  // Atualizar mensagem
  static async update(id: string, updateData: Partial<CreateMessage>): Promise<Message | null> {
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
      UPDATE messages 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    
    return result.rows[0] || null;
  }

  // Deletar mensagem
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM messages WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rowCount > 0;
  }

  // Deletar todas as mensagens de uma conversa
  static async deleteByConversation(conversationId: string): Promise<number> {
    const sql = 'DELETE FROM messages WHERE conversation_id = $1';
    const result = await query(sql, [conversationId]);
    
    return result.rowCount || 0;
  }

  // Buscar mensagens por período
  static async findByDateRange(
    startDate: Date, 
    endDate: Date, 
    limit: number = 100, 
    offset: number = 0
  ): Promise<{
    messages: Message[];
    total: number;
  }> {
    // Query para contar total
    const countSql = 'SELECT COUNT(*) as total FROM messages WHERE created_at BETWEEN $1 AND $2';
    const countResult = await query(countSql, [startDate, endDate]);
    const total = parseInt(countResult.rows[0].total);

    // Query para buscar mensagens
    const sql = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.created_at BETWEEN $1 AND $2
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await query(sql, [startDate, endDate, limit, offset]);
    
    return {
      messages: result.rows,
      total
    };
  }

  // Estatísticas de mensagens
  static async getStats(): Promise<{
    total: number;
    bySenderType: { sender_type: SenderType; count: number }[];
    byContentType: { content_type: string; count: number }[];
    messagesPerDay: { date: string; count: number }[];
  }> {
    // Total de mensagens
    const totalSql = 'SELECT COUNT(*) as total FROM messages';
    const totalResult = await query(totalSql);
    const total = parseInt(totalResult.rows[0].total);

    // Por tipo de remetente
    const senderTypeSql = `
      SELECT sender_type, COUNT(*) as count 
      FROM messages 
      GROUP BY sender_type
    `;
    const senderTypeResult = await query(senderTypeSql);
    const bySenderType = senderTypeResult.rows.map(row => ({
      sender_type: row.sender_type as SenderType,
      count: parseInt(row.count)
    }));

    // Por tipo de conteúdo
    const contentTypeSql = `
      SELECT content_type, COUNT(*) as count 
      FROM messages 
      GROUP BY content_type
    `;
    const contentTypeResult = await query(contentTypeSql);
    const byContentType = contentTypeResult.rows.map(row => ({
      content_type: row.content_type,
      count: parseInt(row.count)
    }));

    // Mensagens por dia (últimos 7 dias)
    const messagesPerDaySql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM messages 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const messagesPerDayResult = await query(messagesPerDaySql);
    const messagesPerDay = messagesPerDayResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));

    return {
      total,
      bySenderType,
      byContentType,
      messagesPerDay
    };
  }

  // Buscar conversas com mensagens recentes
  static async findConversationsWithRecentMessages(hours: number = 24): Promise<any[]> {
    const sql = `
      SELECT DISTINCT 
        c.id as conversation_id,
        c.customer_identifier,
        c.status,
        ch.type as channel_type,
        u.full_name as assignee_name,
        m.created_at as last_message_at,
        m.content as last_message_content,
        m.sender_type as last_sender_type
      FROM conversations c
      JOIN messages m ON c.id = m.conversation_id
      JOIN channels ch ON c.channel_id = ch.id
      LEFT JOIN users u ON c.assignee_id = u.id
      WHERE m.created_at >= NOW() - INTERVAL '${hours} hours'
      AND m.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      )
      ORDER BY m.created_at DESC
    `;
    
    const result = await query(sql);
    return result.rows;
  }
}


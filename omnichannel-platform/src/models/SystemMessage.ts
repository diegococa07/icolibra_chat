import { query } from '../database/connection';
import { SystemMessage } from '../types';

export class SystemMessageModel {

  // Buscar todas as mensagens do sistema
  static async findAll(): Promise<SystemMessage[]> {
    const sql = `
      SELECT id, message_key, content, description, created_at, updated_at
      FROM system_messages
      ORDER BY message_key ASC
    `;
    
    const result = await query(sql);
    return result.rows;
  }

  // Buscar mensagem por chave
  static async findByKey(messageKey: string): Promise<SystemMessage | null> {
    const sql = `
      SELECT id, message_key, content, description, created_at, updated_at
      FROM system_messages
      WHERE message_key = $1
    `;
    
    const result = await query(sql, [messageKey]);
    return result.rows[0] || null;
  }

  // Buscar mensagem por ID
  static async findById(id: string): Promise<SystemMessage | null> {
    const sql = `
      SELECT id, message_key, content, description, created_at, updated_at
      FROM system_messages
      WHERE id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  // Atualizar conteúdo de uma mensagem por chave
  static async updateByKey(messageKey: string, content: string): Promise<SystemMessage | null> {
    const sql = `
      UPDATE system_messages
      SET content = $2, updated_at = NOW()
      WHERE message_key = $1
      RETURNING id, message_key, content, description, created_at, updated_at
    `;
    
    const result = await query(sql, [messageKey, content]);
    return result.rows[0] || null;
  }

  // Criar nova mensagem do sistema
  static async create(messageKey: string, content: string, description?: string): Promise<SystemMessage> {
    const sql = `
      INSERT INTO system_messages (id, message_key, content, description, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
      RETURNING id, message_key, content, description, created_at, updated_at
    `;
    
    const result = await query(sql, [messageKey, content, description]);
    return result.rows[0];
  }

  // Deletar mensagem do sistema
  static async delete(messageKey: string): Promise<boolean> {
    const sql = `
      DELETE FROM system_messages
      WHERE message_key = $1
    `;
    
    const result = await query(sql, [messageKey]);
    return result.rowCount > 0;
  }

  // Buscar conteúdo de uma mensagem específica (usado pelo bot)
  static async getMessageContent(messageKey: string): Promise<string | null> {
    const sql = `
      SELECT content
      FROM system_messages
      WHERE message_key = $1
    `;
    
    const result = await query(sql, [messageKey]);
    return result.rows[0]?.content || null;
  }

  // Substituir placeholders na mensagem
  static replacePlaceholders(content: string, placeholders: Record<string, string>): string {
    let result = content;
    
    Object.entries(placeholders).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return result;
  }

  // Obter mensagem formatada com placeholders
  static async getFormattedMessage(
    messageKey: string, 
    placeholders: Record<string, string> = {}
  ): Promise<string | null> {
    const content = await SystemMessageModel.getMessageContent(messageKey);
    
    if (!content) {
      return null;
    }
    
    return SystemMessageModel.replacePlaceholders(content, placeholders);
  }
}


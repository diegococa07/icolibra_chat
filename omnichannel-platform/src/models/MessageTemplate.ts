import { query } from '../database/connection';
import { MessageTemplate, CreateMessageTemplate, UpdateMessageTemplate, MessageTemplateStatus } from '../types';

class MessageTemplateModel {
  /**
   * Busca todos os templates de mensagem
   */
  static async findAll(): Promise<MessageTemplate[]> {
    const result = await query('SELECT * FROM message_templates ORDER BY created_at DESC');
    return result.rows;
  }

  /**
   * Busca templates de mensagem por status
   */
  static async findByStatus(status: MessageTemplateStatus): Promise<MessageTemplate[]> {
    const result = await query('SELECT * FROM message_templates WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows;
  }

  /**
   * Busca um template de mensagem pelo ID
   */
  static async findById(id: string): Promise<MessageTemplate | null> {
    const result = await query('SELECT * FROM message_templates WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Cria um novo template de mensagem
   */
  static async create(template: CreateMessageTemplate): Promise<MessageTemplate> {
    const { name, body, whatsapp_template_id, status = MessageTemplateStatus.DRAFT } = template;
    
    const result = await query(
      'INSERT INTO message_templates (name, body, whatsapp_template_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, body, whatsapp_template_id, status]
    );
    
    return result.rows[0];
  }

  /**
   * Atualiza um template de mensagem existente
   */
  static async update(id: string, template: UpdateMessageTemplate): Promise<MessageTemplate | null> {
    // Construir a query dinamicamente com base nos campos fornecidos
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (template.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(template.name);
      paramIndex++;
    }

    if (template.body !== undefined) {
      updates.push(`body = $${paramIndex}`);
      values.push(template.body);
      paramIndex++;
    }

    if (template.whatsapp_template_id !== undefined) {
      updates.push(`whatsapp_template_id = $${paramIndex}`);
      values.push(template.whatsapp_template_id);
      paramIndex++;
    }

    if (template.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(template.status);
      paramIndex++;
    }

    // Se não houver campos para atualizar, retornar null
    if (updates.length === 0) {
      return null;
    }

    // Adicionar o ID ao final dos valores
    values.push(id);

    const result = await query(
      `UPDATE message_templates SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Atualiza o status de um template de mensagem
   */
  static async updateStatus(id: string, status: MessageTemplateStatus): Promise<MessageTemplate | null> {
    const result = await query(
      'UPDATE message_templates SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Exclui um template de mensagem
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM message_templates WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
}

export default MessageTemplateModel;


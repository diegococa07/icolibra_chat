import { query } from '../database';
import { Campaign, CreateCampaign, UpdateCampaign, CampaignStatus } from '../types';

export class CampaignModel {
  /**
   * Busca todas as campanhas
   */
  static async findAll(): Promise<Campaign[]> {
    const result = await query(
      'SELECT * FROM campaigns ORDER BY created_at DESC',
      []
    );
    return result.rows;
  }

  /**
   * Busca campanhas por status
   */
  static async findByStatus(status: CampaignStatus): Promise<Campaign[]> {
    const result = await query(
      'SELECT * FROM campaigns WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows;
  }

  /**
   * Busca campanhas agendadas para um determinado período
   */
  static async findScheduledBetween(startDate: Date, endDate: Date): Promise<Campaign[]> {
    const result = await query(
      'SELECT * FROM campaigns WHERE status = $1 AND scheduled_at BETWEEN $2 AND $3 ORDER BY scheduled_at ASC',
      [CampaignStatus.SCHEDULED, startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Busca uma campanha pelo ID
   */
  static async findById(id: string): Promise<Campaign | null> {
    const result = await query(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Cria uma nova campanha
   */
  static async create(data: CreateCampaign): Promise<Campaign> {
    const { name, message_template_id, target_criteria, template_variables, scheduled_at, status } = data;
    
    const result = await query(
      `INSERT INTO campaigns 
       (name, message_template_id, target_criteria, template_variables, scheduled_at, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, message_template_id, target_criteria, template_variables, scheduled_at, status || CampaignStatus.DRAFT]
    );
    
    return result.rows[0];
  }

  /**
   * Atualiza uma campanha existente
   */
  static async update(id: string, data: UpdateCampaign): Promise<Campaign | null> {
    // Primeiro, verificamos se a campanha existe
    const campaign = await this.findById(id);
    if (!campaign) {
      return null;
    }

    // Construímos a query de atualização dinamicamente
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.message_template_id !== undefined) {
      updates.push(`message_template_id = $${paramCount++}`);
      values.push(data.message_template_id);
    }

    if (data.target_criteria !== undefined) {
      updates.push(`target_criteria = $${paramCount++}`);
      values.push(data.target_criteria);
    }

    if (data.template_variables !== undefined) {
      updates.push(`template_variables = $${paramCount++}`);
      values.push(data.template_variables);
    }

    if (data.scheduled_at !== undefined) {
      updates.push(`scheduled_at = $${paramCount++}`);
      values.push(data.scheduled_at);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    // Se não há nada para atualizar, retornamos a campanha atual
    if (updates.length === 0) {
      return campaign;
    }

    // Adicionamos o ID como último parâmetro
    values.push(id);

    const result = await query(
      `UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Atualiza apenas o status de uma campanha
   */
  static async updateStatus(id: string, status: CampaignStatus): Promise<Campaign | null> {
    const result = await query(
      'UPDATE campaigns SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Exclui uma campanha
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM campaigns WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows.length > 0;
  }
}


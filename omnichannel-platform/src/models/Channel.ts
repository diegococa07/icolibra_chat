import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Channel, CreateChannel, ChannelType } from '../types';

export class ChannelModel {
  
  // Criar um novo canal
  static async create(channelData: CreateChannel): Promise<Channel> {
    const id = uuidv4();
    const { type, is_active = true } = channelData;

    const sql = `
      INSERT INTO channels (id, type, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [id, type, is_active];
    const result = await query(sql, values);
    
    return result.rows[0];
  }

  // Buscar canal por ID
  static async findById(id: string): Promise<Channel | null> {
    const sql = 'SELECT * FROM channels WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rows[0] || null;
  }

  // Buscar canal por tipo
  static async findByType(type: ChannelType): Promise<Channel | null> {
    const sql = 'SELECT * FROM channels WHERE type = $1';
    const result = await query(sql, [type]);
    
    return result.rows[0] || null;
  }

  // Listar todos os canais
  static async findAll(): Promise<Channel[]> {
    const sql = 'SELECT * FROM channels ORDER BY type';
    const result = await query(sql);
    
    return result.rows;
  }

  // Listar apenas canais ativos
  static async findActive(): Promise<Channel[]> {
    const sql = 'SELECT * FROM channels WHERE is_active = true ORDER BY type';
    const result = await query(sql);
    
    return result.rows;
  }

  // Atualizar canal
  static async update(id: string, updateData: Partial<CreateChannel>): Promise<Channel | null> {
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
      UPDATE channels 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    
    return result.rows[0] || null;
  }

  // Ativar/desativar canal
  static async toggleActive(id: string, isActive: boolean): Promise<Channel | null> {
    const sql = `
      UPDATE channels 
      SET is_active = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [isActive, id]);
    
    return result.rows[0] || null;
  }

  // Ativar canal por tipo
  static async activateByType(type: ChannelType): Promise<Channel | null> {
    const sql = `
      UPDATE channels 
      SET is_active = true
      WHERE type = $1
      RETURNING *
    `;

    const result = await query(sql, [type]);
    
    return result.rows[0] || null;
  }

  // Desativar canal por tipo
  static async deactivateByType(type: ChannelType): Promise<Channel | null> {
    const sql = `
      UPDATE channels 
      SET is_active = false
      WHERE type = $1
      RETURNING *
    `;

    const result = await query(sql, [type]);
    
    return result.rows[0] || null;
  }

  // Deletar canal
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM channels WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rowCount > 0;
  }

  // Verificar se um tipo de canal existe
  static async existsByType(type: ChannelType): Promise<boolean> {
    const sql = 'SELECT COUNT(*) as count FROM channels WHERE type = $1';
    const result = await query(sql, [type]);
    
    return parseInt(result.rows[0].count) > 0;
  }

  // Contar canais por status
  static async countByStatus(): Promise<{ active: number; inactive: number }> {
    const sql = `
      SELECT 
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive
      FROM channels
    `;
    
    const result = await query(sql);
    const row = result.rows[0];
    
    return {
      active: parseInt(row.active) || 0,
      inactive: parseInt(row.inactive) || 0
    };
  }

  // Inicializar canais padrão (WhatsApp e Webchat)
  static async initializeDefaultChannels(): Promise<Channel[]> {
    const channels = [];
    
    // Verificar se WhatsApp já existe
    const whatsappExists = await this.existsByType(ChannelType.WHATSAPP);
    if (!whatsappExists) {
      const whatsappChannel = await this.create({
        type: ChannelType.WHATSAPP,
        is_active: true
      });
      channels.push(whatsappChannel);
    }

    // Verificar se Webchat já existe
    const webchatExists = await this.existsByType(ChannelType.WEBCHAT);
    if (!webchatExists) {
      const webchatChannel = await this.create({
        type: ChannelType.WEBCHAT,
        is_active: true
      });
      channels.push(webchatChannel);
    }

    return channels;
  }
}


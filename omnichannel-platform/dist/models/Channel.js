"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelModel = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
const types_1 = require("../types");
class ChannelModel {
    // Criar um novo canal
    static async create(channelData) {
        const id = (0, uuid_1.v4)();
        const { type, is_active = true } = channelData;
        const sql = `
      INSERT INTO channels (id, type, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const values = [id, type, is_active];
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0];
    }
    // Buscar canal por ID
    static async findById(id) {
        const sql = 'SELECT * FROM channels WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Buscar canal por tipo
    static async findByType(type) {
        const sql = 'SELECT * FROM channels WHERE type = $1';
        const result = await (0, connection_1.query)(sql, [type]);
        return result.rows[0] || null;
    }
    // Listar todos os canais
    static async findAll() {
        const sql = 'SELECT * FROM channels ORDER BY type';
        const result = await (0, connection_1.query)(sql);
        return result.rows;
    }
    // Listar apenas canais ativos
    static async findActive() {
        const sql = 'SELECT * FROM channels WHERE is_active = true ORDER BY type';
        const result = await (0, connection_1.query)(sql);
        return result.rows;
    }
    // Atualizar canal
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
      UPDATE channels 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0] || null;
    }
    // Ativar/desativar canal
    static async toggleActive(id, isActive) {
        const sql = `
      UPDATE channels 
      SET is_active = $1
      WHERE id = $2
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [isActive, id]);
        return result.rows[0] || null;
    }
    // Ativar canal por tipo
    static async activateByType(type) {
        const sql = `
      UPDATE channels 
      SET is_active = true
      WHERE type = $1
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [type]);
        return result.rows[0] || null;
    }
    // Desativar canal por tipo
    static async deactivateByType(type) {
        const sql = `
      UPDATE channels 
      SET is_active = false
      WHERE type = $1
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [type]);
        return result.rows[0] || null;
    }
    // Deletar canal
    static async delete(id) {
        const sql = 'DELETE FROM channels WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rowCount > 0;
    }
    // Verificar se um tipo de canal existe
    static async existsByType(type) {
        const sql = 'SELECT COUNT(*) as count FROM channels WHERE type = $1';
        const result = await (0, connection_1.query)(sql, [type]);
        return parseInt(result.rows[0].count) > 0;
    }
    // Contar canais por status
    static async countByStatus() {
        const sql = `
      SELECT 
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive
      FROM channels
    `;
        const result = await (0, connection_1.query)(sql);
        const row = result.rows[0];
        return {
            active: parseInt(row.active) || 0,
            inactive: parseInt(row.inactive) || 0
        };
    }
    // Inicializar canais padrão (WhatsApp e Webchat)
    static async initializeDefaultChannels() {
        const channels = [];
        // Verificar se WhatsApp já existe
        const whatsappExists = await this.existsByType(types_1.ChannelType.WHATSAPP);
        if (!whatsappExists) {
            const whatsappChannel = await this.create({
                type: types_1.ChannelType.WHATSAPP,
                is_active: true
            });
            channels.push(whatsappChannel);
        }
        // Verificar se Webchat já existe
        const webchatExists = await this.existsByType(types_1.ChannelType.WEBCHAT);
        if (!webchatExists) {
            const webchatChannel = await this.create({
                type: types_1.ChannelType.WEBCHAT,
                is_active: true
            });
            channels.push(webchatChannel);
        }
        return channels;
    }
}
exports.ChannelModel = ChannelModel;
//# sourceMappingURL=Channel.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteActionModel = void 0;
const connection_1 = require("../database/connection");
class WriteActionModel {
    // Criar uma nova ação de escrita
    static async create(data) {
        const query = `
      INSERT INTO write_actions (name, http_method, endpoint, request_body_template, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const values = [
            data.name,
            data.http_method,
            data.endpoint,
            data.request_body_template,
            data.is_active ?? true
        ];
        const result = await connection_1.pool.query(query, values);
        return result.rows[0];
    }
    // Buscar todas as ações de escrita
    static async findAll(activeOnly = false) {
        let query = 'SELECT * FROM write_actions';
        const values = [];
        if (activeOnly) {
            query += ' WHERE is_active = $1';
            values.push(true);
        }
        query += ' ORDER BY created_at DESC';
        const result = await connection_1.pool.query(query, values);
        return result.rows;
    }
    // Buscar ação de escrita por ID
    static async findById(id) {
        const query = 'SELECT * FROM write_actions WHERE id = $1';
        const result = await connection_1.pool.query(query, [id]);
        return result.rows[0] || null;
    }
    // Atualizar ação de escrita
    static async update(id, data) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (data.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.http_method !== undefined) {
            fields.push(`http_method = $${paramCount++}`);
            values.push(data.http_method);
        }
        if (data.endpoint !== undefined) {
            fields.push(`endpoint = $${paramCount++}`);
            values.push(data.endpoint);
        }
        if (data.request_body_template !== undefined) {
            fields.push(`request_body_template = $${paramCount++}`);
            values.push(data.request_body_template);
        }
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramCount++}`);
            values.push(data.is_active);
        }
        if (fields.length === 0) {
            return this.findById(id);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const query = `
      UPDATE write_actions 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await connection_1.pool.query(query, values);
        return result.rows[0] || null;
    }
    // Deletar ação de escrita
    static async delete(id) {
        const query = 'DELETE FROM write_actions WHERE id = $1';
        const result = await connection_1.pool.query(query, [id]);
        return result.rowCount > 0;
    }
    // Ativar/Desativar ação de escrita
    static async toggleActive(id) {
        const query = `
      UPDATE write_actions 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const result = await connection_1.pool.query(query, [id]);
        return result.rows[0] || null;
    }
    // Substituir variáveis no template do corpo da requisição
    static replaceVariables(template, variables) {
        let result = template;
        // Substituir variáveis no formato {{variable_name}}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
    // Validar template JSON
    static validateJsonTemplate(template) {
        try {
            // Tentar parsear o template substituindo variáveis por valores de teste
            const testTemplate = template.replace(/\{\{[^}]+\}\}/g, '"test_value"');
            JSON.parse(testTemplate);
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Template JSON inválido'
            };
        }
    }
    // Extrair variáveis do template
    static extractVariables(template) {
        const regex = /\{\{([^}]+)\}\}/g;
        const variables = [];
        let match;
        while ((match = regex.exec(template)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }
}
exports.WriteActionModel = WriteActionModel;
//# sourceMappingURL=WriteAction.js.map
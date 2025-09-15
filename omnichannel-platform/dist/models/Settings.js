"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModel = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class SettingsModel {
    // Criar configurações iniciais
    static async create(settingsData) {
        const id = (0, uuid_1.v4)();
        const { whatsapp_api_key, whatsapp_endpoint_url, erp_api_base_url, erp_api_auth_token, webchat_snippet_id } = settingsData;
        const sql = `
      INSERT INTO settings (id, whatsapp_api_key, whatsapp_endpoint_url, erp_api_base_url, erp_api_auth_token, webchat_snippet_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const values = [id, whatsapp_api_key, whatsapp_endpoint_url, erp_api_base_url, erp_api_auth_token, webchat_snippet_id];
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0];
    }
    // Buscar configurações (deve haver apenas um registro)
    static async get() {
        const sql = 'SELECT * FROM settings LIMIT 1';
        const result = await (0, connection_1.query)(sql);
        return result.rows[0] || null;
    }
    // Alias para compatibilidade
    static async findFirst() {
        return await this.get();
    }
    static async update(idOrData, updateData) {
        let actualUpdateData;
        let targetId = null;
        if (typeof idOrData === 'string') {
            // Chamada com ID específico
            targetId = idOrData;
            actualUpdateData = updateData;
        }
        else {
            // Chamada sem ID - usar o registro existente
            actualUpdateData = idOrData;
            const existing = await this.get();
            if (existing) {
                targetId = existing.id;
            }
        }
        if (!targetId) {
            // Se não existe, criar um novo
            return await this.create(actualUpdateData);
        }
        const fields = [];
        const values = [];
        let paramCount = 1;
        // Construir query dinamicamente baseada nos campos fornecidos
        Object.entries(actualUpdateData).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        if (fields.length === 0) {
            throw new Error('Nenhum campo para atualizar foi fornecido');
        }
        values.push(targetId); // ID sempre é o último parâmetro
        const sql = `
      UPDATE settings 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0] || null;
    }
    // Atualizar configurações do WhatsApp
    static async updateWhatsAppConfig(apiKey, endpointUrl) {
        return await this.update({
            whatsapp_api_key: apiKey,
            whatsapp_endpoint_url: endpointUrl
        });
    }
    // Atualizar configurações do ERP
    static async updateERPConfig(baseUrl, authToken) {
        return await this.update({
            erp_api_base_url: baseUrl,
            erp_api_auth_token: authToken
        });
    }
    // Atualizar ID do snippet do webchat
    static async updateWebchatSnippet(snippetId) {
        return await this.update({
            webchat_snippet_id: snippetId
        });
    }
    // Verificar se as configurações estão completas
    static async isConfigurationComplete() {
        const settings = await this.get();
        if (!settings) {
            return {
                isComplete: false,
                missingFields: ['whatsapp_api_key', 'whatsapp_endpoint_url', 'erp_api_base_url', 'erp_api_auth_token', 'webchat_snippet_id']
            };
        }
        const requiredFields = [
            'whatsapp_api_key',
            'whatsapp_endpoint_url',
            'erp_api_base_url',
            'erp_api_auth_token',
            'webchat_snippet_id'
        ];
        const missingFields = requiredFields.filter(field => !settings[field]);
        return {
            isComplete: missingFields.length === 0,
            missingFields
        };
    }
    // Resetar todas as configurações
    static async reset() {
        const sql = `
      UPDATE settings 
      SET whatsapp_api_key = NULL,
          whatsapp_endpoint_url = NULL,
          erp_api_base_url = NULL,
          erp_api_auth_token = NULL,
          webchat_snippet_id = NULL
    `;
        const result = await (0, connection_1.query)(sql);
        return (result.rowCount || 0) > 0;
    }
}
exports.SettingsModel = SettingsModel;
//# sourceMappingURL=Settings.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotFlowModel = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class ChatbotFlowModel {
    // Criar um novo fluxo de chatbot
    static async create(flowData) {
        const id = (0, uuid_1.v4)();
        const { name, flow_definition, is_active = false } = flowData;
        const sql = `
      INSERT INTO chatbot_flows (id, name, flow_definition, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [id, name, JSON.stringify(flow_definition), is_active];
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0];
    }
    // Buscar fluxo por ID
    static async findById(id) {
        const sql = 'SELECT * FROM chatbot_flows WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Buscar fluxo por nome
    static async findByName(name) {
        const sql = 'SELECT * FROM chatbot_flows WHERE name = $1';
        const result = await (0, connection_1.query)(sql, [name]);
        return result.rows[0] || null;
    }
    // Listar todos os fluxos
    static async findAll() {
        const sql = 'SELECT * FROM chatbot_flows ORDER BY name';
        const result = await (0, connection_1.query)(sql);
        return result.rows;
    }
    // Listar apenas fluxos ativos
    static async findAllActive() {
        const sql = 'SELECT * FROM chatbot_flows WHERE is_active = true ORDER BY name';
        const result = await (0, connection_1.query)(sql);
        return result.rows;
    }
    // Buscar fluxo ativo principal (deve haver apenas um)
    static async findMainActive() {
        const sql = 'SELECT * FROM chatbot_flows WHERE is_active = true LIMIT 1';
        const result = await (0, connection_1.query)(sql);
        return result.rows[0] || null;
    }
    // Alias para compatibilidade - retorna o fluxo ativo principal
    static async findActive() {
        return await this.findMainActive();
    }
    // Atualizar fluxo
    static async update(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        // Construir query dinamicamente baseada nos campos fornecidos
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'flow_definition') {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(JSON.stringify(value));
                }
                else {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(value);
                }
                paramCount++;
            }
        });
        if (fields.length === 0) {
            throw new Error('Nenhum campo para atualizar foi fornecido');
        }
        values.push(id); // ID sempre é o último parâmetro
        const sql = `
      UPDATE chatbot_flows 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0] || null;
    }
    // Ativar fluxo (desativa todos os outros)
    static async activate(id) {
        // Primeiro, desativar todos os fluxos
        await (0, connection_1.query)('UPDATE chatbot_flows SET is_active = false');
        // Depois, ativar o fluxo específico
        const sql = `
      UPDATE chatbot_flows 
      SET is_active = true
      WHERE id = $1
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Desativar fluxo
    static async deactivate(id) {
        const sql = `
      UPDATE chatbot_flows 
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Desativar todos os fluxos
    static async deactivateAll() {
        const sql = 'UPDATE chatbot_flows SET is_active = false';
        const result = await (0, connection_1.query)(sql);
        return result.rowCount || 0;
    }
    // Deletar fluxo
    static async delete(id) {
        const sql = 'DELETE FROM chatbot_flows WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    // Duplicar fluxo
    static async duplicate(id, newName) {
        const originalFlow = await this.findById(id);
        if (!originalFlow) {
            throw new Error('Fluxo original não encontrado');
        }
        const duplicatedFlow = await this.create({
            name: newName,
            flow_definition: originalFlow.flow_definition,
            is_active: false
        });
        return duplicatedFlow;
    }
    // Validar estrutura do fluxo
    static validateFlowDefinition(flowDefinition) {
        const errors = [];
        // Verificar se é um objeto
        if (typeof flowDefinition !== 'object' || flowDefinition === null) {
            errors.push('Flow definition deve ser um objeto');
            return { isValid: false, errors };
        }
        // Verificar se tem nós
        if (!flowDefinition.nodes || !Array.isArray(flowDefinition.nodes)) {
            errors.push('Flow definition deve conter um array de nós');
        }
        // Verificar se tem conexões
        if (!flowDefinition.connections || !Array.isArray(flowDefinition.connections)) {
            errors.push('Flow definition deve conter um array de conexões');
        }
        // Verificar se tem nó inicial
        const hasStartNode = flowDefinition.nodes?.some((node) => node.type === 'start');
        if (!hasStartNode) {
            errors.push('Flow definition deve conter pelo menos um nó inicial');
        }
        // Verificar estrutura básica dos nós
        if (flowDefinition.nodes) {
            flowDefinition.nodes.forEach((node, index) => {
                if (!node.id) {
                    errors.push(`Nó ${index} deve ter um ID`);
                }
                if (!node.type) {
                    errors.push(`Nó ${index} deve ter um tipo`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    // Contar fluxos por status
    static async countByStatus() {
        const sql = `
      SELECT 
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive
      FROM chatbot_flows
    `;
        const result = await (0, connection_1.query)(sql);
        const row = result.rows[0];
        return {
            active: parseInt(row.active) || 0,
            inactive: parseInt(row.inactive) || 0
        };
    }
    // Buscar fluxos por período de criação
    static async findByDateRange(startDate, endDate) {
        const sql = `
      SELECT * FROM chatbot_flows 
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `;
        const result = await (0, connection_1.query)(sql, [startDate, endDate]);
        return result.rows;
    }
    // Exportar fluxo para JSON
    static async exportFlow(id) {
        const flow = await this.findById(id);
        if (!flow) {
            return null;
        }
        return {
            metadata: {
                id: flow.id,
                name: flow.name,
                exported_at: new Date(),
                version: '1.0'
            },
            flow
        };
    }
    // Importar fluxo de JSON
    static async importFlow(importData, newName) {
        const flowName = newName || `${importData.flow.name} (Importado)`;
        // Validar estrutura do fluxo
        const validation = this.validateFlowDefinition(importData.flow.flow_definition);
        if (!validation.isValid) {
            throw new Error(`Fluxo inválido: ${validation.errors.join(', ')}`);
        }
        const newFlow = await this.create({
            name: flowName,
            flow_definition: importData.flow.flow_definition,
            is_active: false
        });
        return newFlow;
    }
}
exports.ChatbotFlowModel = ChatbotFlowModel;
//# sourceMappingURL=ChatbotFlow.js.map
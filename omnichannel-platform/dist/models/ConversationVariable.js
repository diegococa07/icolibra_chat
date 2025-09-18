"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationVariableModel = void 0;
const connection_1 = require("../database/connection");
class ConversationVariableModel {
    // Criar ou atualizar uma variável de conversa
    static async upsert(conversationId, variableName, variableValue) {
        const query = `
      INSERT INTO conversation_variables (conversation_id, variable_name, variable_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (conversation_id, variable_name)
      DO UPDATE SET 
        variable_value = EXCLUDED.variable_value,
        updated_at = NOW()
      RETURNING *
    `;
        const values = [conversationId, variableName, variableValue];
        const result = await connection_1.pool.query(query, values);
        return result.rows[0];
    }
    // Buscar todas as variáveis de uma conversa
    static async findByConversationId(conversationId) {
        const query = `
      SELECT * FROM conversation_variables 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC
    `;
        const result = await connection_1.pool.query(query, [conversationId]);
        return result.rows;
    }
    // Buscar uma variável específica de uma conversa
    static async findByConversationAndName(conversationId, variableName) {
        const query = `
      SELECT * FROM conversation_variables 
      WHERE conversation_id = $1 AND variable_name = $2
    `;
        const result = await connection_1.pool.query(query, [conversationId, variableName]);
        return result.rows[0] || null;
    }
    // Buscar valor de uma variável específica
    static async getVariableValue(conversationId, variableName) {
        const variable = await this.findByConversationAndName(conversationId, variableName);
        return variable ? variable.variable_value : null;
    }
    // Buscar todas as variáveis como um objeto chave-valor
    static async getVariablesAsObject(conversationId) {
        const variables = await this.findByConversationId(conversationId);
        const result = {};
        for (const variable of variables) {
            result[variable.variable_name] = variable.variable_value;
        }
        return result;
    }
    // Deletar uma variável específica
    static async deleteVariable(conversationId, variableName) {
        const query = `
      DELETE FROM conversation_variables 
      WHERE conversation_id = $1 AND variable_name = $2
    `;
        const result = await connection_1.pool.query(query, [conversationId, variableName]);
        return result.rowCount > 0;
    }
    // Deletar todas as variáveis de uma conversa
    static async deleteAllByConversation(conversationId) {
        const query = 'DELETE FROM conversation_variables WHERE conversation_id = $1';
        const result = await connection_1.pool.query(query, [conversationId]);
        return result.rowCount;
    }
    // Verificar se uma variável existe
    static async exists(conversationId, variableName) {
        const query = `
      SELECT 1 FROM conversation_variables 
      WHERE conversation_id = $1 AND variable_name = $2 
      LIMIT 1
    `;
        const result = await connection_1.pool.query(query, [conversationId, variableName]);
        return result.rows.length > 0;
    }
    // Contar variáveis de uma conversa
    static async countByConversation(conversationId) {
        const query = `
      SELECT COUNT(*) as count 
      FROM conversation_variables 
      WHERE conversation_id = $1
    `;
        const result = await connection_1.pool.query(query, [conversationId]);
        return parseInt(result.rows[0].count);
    }
    // Buscar conversas que possuem uma variável específica
    static async findConversationsWithVariable(variableName, variableValue) {
        let query = `
      SELECT DISTINCT conversation_id 
      FROM conversation_variables 
      WHERE variable_name = $1
    `;
        const values = [variableName];
        if (variableValue) {
            query += ' AND variable_value = $2';
            values.push(variableValue);
        }
        const result = await connection_1.pool.query(query, values);
        return result.rows.map(row => row.conversation_id);
    }
    // Limpar variáveis antigas (mais de X dias)
    static async cleanupOldVariables(daysOld = 30) {
        const query = `
      DELETE FROM conversation_variables 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;
        const result = await connection_1.pool.query(query);
        return result.rowCount;
    }
}
exports.ConversationVariableModel = ConversationVariableModel;
//# sourceMappingURL=ConversationVariable.js.map
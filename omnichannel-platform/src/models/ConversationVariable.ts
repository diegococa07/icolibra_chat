import { pool } from '../database/connection';
import { ConversationVariable } from '../types';

export class ConversationVariableModel {
  
  // Criar ou atualizar uma variável de conversa
  static async upsert(conversationId: string, variableName: string, variableValue: string): Promise<ConversationVariable> {
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
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Buscar todas as variáveis de uma conversa
  static async findByConversationId(conversationId: string): Promise<ConversationVariable[]> {
    const query = `
      SELECT * FROM conversation_variables 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }

  // Buscar uma variável específica de uma conversa
  static async findByConversationAndName(conversationId: string, variableName: string): Promise<ConversationVariable | null> {
    const query = `
      SELECT * FROM conversation_variables 
      WHERE conversation_id = $1 AND variable_name = $2
    `;
    const result = await pool.query(query, [conversationId, variableName]);
    return result.rows[0] || null;
  }

  // Buscar valor de uma variável específica
  static async getVariableValue(conversationId: string, variableName: string): Promise<string | null> {
    const variable = await this.findByConversationAndName(conversationId, variableName);
    return variable ? variable.variable_value : null;
  }

  // Buscar todas as variáveis como um objeto chave-valor
  static async getVariablesAsObject(conversationId: string): Promise<Record<string, string>> {
    const variables = await this.findByConversationId(conversationId);
    const result: Record<string, string> = {};
    
    for (const variable of variables) {
      result[variable.variable_name] = variable.variable_value;
    }
    
    return result;
  }

  // Deletar uma variável específica
  static async deleteVariable(conversationId: string, variableName: string): Promise<boolean> {
    const query = `
      DELETE FROM conversation_variables 
      WHERE conversation_id = $1 AND variable_name = $2
    `;
    const result = await pool.query(query, [conversationId, variableName]);
    return result.rowCount > 0;
  }

  // Deletar todas as variáveis de uma conversa
  static async deleteAllByConversation(conversationId: string): Promise<number> {
    const query = 'DELETE FROM conversation_variables WHERE conversation_id = $1';
    const result = await pool.query(query, [conversationId]);
    return result.rowCount;
  }

  // Verificar se uma variável existe
  static async exists(conversationId: string, variableName: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM conversation_variables 
      WHERE conversation_id = $1 AND variable_name = $2 
      LIMIT 1
    `;
    const result = await pool.query(query, [conversationId, variableName]);
    return result.rows.length > 0;
  }

  // Contar variáveis de uma conversa
  static async countByConversation(conversationId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM conversation_variables 
      WHERE conversation_id = $1
    `;
    const result = await pool.query(query, [conversationId]);
    return parseInt(result.rows[0].count);
  }

  // Buscar conversas que possuem uma variável específica
  static async findConversationsWithVariable(variableName: string, variableValue?: string): Promise<string[]> {
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
    
    const result = await pool.query(query, values);
    return result.rows.map(row => row.conversation_id);
  }

  // Limpar variáveis antigas (mais de X dias)
  static async cleanupOldVariables(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM conversation_variables 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }
}


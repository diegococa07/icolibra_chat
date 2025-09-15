import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { Settings, CreateSettings } from '../types';

export class SettingsModel {
  
  // Criar configurações iniciais
  static async create(settingsData: CreateSettings): Promise<Settings> {
    const id = uuidv4();
    const {
      whatsapp_api_key,
      whatsapp_endpoint_url,
      erp_api_base_url,
      erp_api_auth_token,
      webchat_snippet_id
    } = settingsData;

    const sql = `
      INSERT INTO settings (id, whatsapp_api_key, whatsapp_endpoint_url, erp_api_base_url, erp_api_auth_token, webchat_snippet_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [id, whatsapp_api_key, whatsapp_endpoint_url, erp_api_base_url, erp_api_auth_token, webchat_snippet_id];
    const result = await query(sql, values);
    
    return result.rows[0];
  }

  // Buscar configurações (deve haver apenas um registro)
  static async get(): Promise<Settings | null> {
    const sql = 'SELECT * FROM settings LIMIT 1';
    const result = await query(sql);
    
    return result.rows[0] || null;
  }

  // Alias para compatibilidade
  static async findFirst(): Promise<Settings | null> {
    return await this.get();
  }

  // Atualizar configurações
  static async update(id: string, updateData: Partial<CreateSettings>): Promise<Settings | null>;
  static async update(updateData: Partial<CreateSettings>): Promise<Settings | null>;
  static async update(idOrData: string | Partial<CreateSettings>, updateData?: Partial<CreateSettings>): Promise<Settings | null> {
    let actualUpdateData: Partial<CreateSettings>;
    let targetId: string | null = null;

    if (typeof idOrData === 'string') {
      // Chamada com ID específico
      targetId = idOrData;
      actualUpdateData = updateData!;
    } else {
      // Chamada sem ID - usar o registro existente
      actualUpdateData = idOrData;
      const existing = await this.get();
      if (existing) {
        targetId = existing.id;
      }
    }

    if (!targetId) {
      // Se não existe, criar um novo
      return await this.create(actualUpdateData as CreateSettings);
    }

    const fields: string[] = [];
    const values: any[] = [];
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

    const result = await query(sql, values);
    
    return result.rows[0] || null;
  }

  // Atualizar configurações do WhatsApp
  static async updateWhatsAppConfig(apiKey: string, endpointUrl: string): Promise<Settings | null> {
    return await this.update({
      whatsapp_api_key: apiKey,
      whatsapp_endpoint_url: endpointUrl
    });
  }

  // Atualizar configurações do ERP
  static async updateERPConfig(baseUrl: string, authToken: string): Promise<Settings | null> {
    return await this.update({
      erp_api_base_url: baseUrl,
      erp_api_auth_token: authToken
    });
  }

  // Atualizar ID do snippet do webchat
  static async updateWebchatSnippet(snippetId: string): Promise<Settings | null> {
    return await this.update({
      webchat_snippet_id: snippetId
    });
  }

  // Verificar se as configurações estão completas
  static async isConfigurationComplete(): Promise<{
    isComplete: boolean;
    missingFields: string[];
  }> {
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

    const missingFields = requiredFields.filter(field => !settings[field as keyof Settings]);

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }

  // Resetar todas as configurações
  static async reset(): Promise<boolean> {
    const sql = `
      UPDATE settings 
      SET whatsapp_api_key = NULL,
          whatsapp_endpoint_url = NULL,
          erp_api_base_url = NULL,
          erp_api_auth_token = NULL,
          webchat_snippet_id = NULL
    `;
    
    const result = await query(sql);
    
    return (result.rowCount || 0) > 0;
  }
}


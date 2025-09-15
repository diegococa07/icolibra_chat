import { Request, Response } from 'express';
import { SettingsModel } from '../models/Settings';
import { ValidationUtils } from '../utils/auth';
import axios from 'axios';

// Interfaces para requests
interface UpdateSettingsRequest {
  whatsappApiKey?: string;
  whatsappEndpointUrl?: string;
  erpApiBaseUrl?: string;
  erpApiAuthToken?: string;
}

interface TestConnectionRequest {
  erpApiBaseUrl: string;
  erpApiAuthToken: string;
}

export class SettingsController {
  
  // GET /api/settings
  // Obter todas as configurações (apenas para ADMIN)
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await SettingsModel.findFirst();
      
      if (!settings) {
        // Se não existir configurações, retornar valores padrão
        res.status(200).json({
          message: 'Configurações obtidas com sucesso',
          settings: {
            webchat_snippet_id: null,
            whatsapp_api_key: '',
            whatsapp_endpoint_url: '',
            erp_api_base_url: '',
            erp_api_auth_token: '',
            erp_connection_status: 'not_verified'
          }
        });
        return;
      }

      // Remover dados sensíveis da resposta (mascarar tokens)
      const safeSettings = {
        webchat_snippet_id: settings.webchat_snippet_id,
        whatsapp_api_key: settings.whatsapp_api_key ? '••••••••' : '',
        whatsapp_endpoint_url: settings.whatsapp_endpoint_url,
        erp_api_base_url: settings.erp_api_base_url,
        erp_api_auth_token: settings.erp_api_auth_token ? '••••••••' : '',
        erp_connection_status: settings.erp_connection_status || 'not_verified'
      };

      res.status(200).json({
        message: 'Configurações obtidas com sucesso',
        settings: safeSettings
      });

    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /api/settings
  // Atualizar configurações (apenas para ADMIN)
  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const {
        whatsappApiKey,
        whatsappEndpointUrl,
        erpApiBaseUrl,
        erpApiAuthToken
      }: UpdateSettingsRequest = req.body;

      // Preparar dados para atualização
      const updateData: any = {};

      if (whatsappApiKey !== undefined) {
        updateData.whatsapp_api_key = ValidationUtils.sanitizeInput(whatsappApiKey);
      }

      if (whatsappEndpointUrl !== undefined) {
        updateData.whatsapp_endpoint_url = ValidationUtils.sanitizeInput(whatsappEndpointUrl);
      }

      if (erpApiBaseUrl !== undefined) {
        updateData.erp_api_base_url = ValidationUtils.sanitizeInput(erpApiBaseUrl);
      }

      if (erpApiAuthToken !== undefined) {
        updateData.erp_api_auth_token = ValidationUtils.sanitizeInput(erpApiAuthToken);
      }

      // Se não há dados para atualizar
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: 'Nenhum dado válido fornecido para atualização'
        });
        return;
      }

      // Verificar se já existe configuração
      const existingSettings = await SettingsModel.findFirst();
      
      let settings;
      if (existingSettings) {
        // Atualizar configuração existente
        settings = await SettingsModel.update(existingSettings.id, updateData);
      } else {
        // Criar nova configuração
        settings = await SettingsModel.create(updateData);
      }

      if (!settings) {
        res.status(500).json({
          error: 'Erro ao salvar configurações'
        });
        return;
      }

      // Retornar configurações atualizadas (mascarando dados sensíveis)
      const safeSettings = {
        webchat_snippet_id: settings.webchat_snippet_id,
        whatsapp_api_key: settings.whatsapp_api_key ? '••••••••' : '',
        whatsapp_endpoint_url: settings.whatsapp_endpoint_url,
        erp_api_base_url: settings.erp_api_base_url,
        erp_api_auth_token: settings.erp_api_auth_token ? '••••••••' : '',
        erp_connection_status: settings.erp_connection_status || 'not_verified'
      };

      res.status(200).json({
        message: 'Configurações atualizadas com sucesso',
        settings: safeSettings
      });

    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/settings/test-connection
  // Testar conexão com ERP (apenas para ADMIN)
  static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const { erpApiBaseUrl, erpApiAuthToken }: TestConnectionRequest = req.body;

      // Validações básicas
      if (!erpApiBaseUrl || !erpApiAuthToken) {
        res.status(400).json({
          error: 'URL base e token de autenticação são obrigatórios'
        });
        return;
      }

      // Validar formato da URL
      try {
        new URL(erpApiBaseUrl);
      } catch (urlError) {
        res.status(400).json({
          error: 'URL base inválida'
        });
        return;
      }

      try {
        // Fazer chamada de teste para a API
        const testUrl = erpApiBaseUrl.endsWith('/') ? 
          `${erpApiBaseUrl}health` : 
          `${erpApiBaseUrl}/health`;

        const response = await axios.get(testUrl, {
          headers: {
            'Authorization': `Bearer ${erpApiAuthToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        });

        // Se chegou até aqui, a conexão foi bem-sucedida
        if (response.status >= 200 && response.status < 300) {
          // Atualizar status da conexão no banco
          const existingSettings = await SettingsModel.findFirst();
          if (existingSettings) {
            await SettingsModel.update(existingSettings.id, {
              erp_connection_status: 'connected'
            });
          }

          res.status(200).json({
            success: true,
            message: 'Conexão bem-sucedida!',
            details: `Status: ${response.status}`
          });
        } else {
          throw new Error(`Status inesperado: ${response.status}`);
        }

      } catch (apiError: any) {
        // Atualizar status da conexão como falha
        const existingSettings = await SettingsModel.findFirst();
        if (existingSettings) {
          await SettingsModel.update(existingSettings.id, {
            erp_connection_status: 'failed'
          });
        }

        let errorMessage = 'Falha ao conectar. Verifique a URL e o Token.';
        
        if (apiError.code === 'ECONNREFUSED') {
          errorMessage = 'Conexão recusada. Verifique se a URL está correta e o serviço está ativo.';
        } else if (apiError.code === 'ENOTFOUND') {
          errorMessage = 'URL não encontrada. Verifique se o endereço está correto.';
        } else if (apiError.code === 'ETIMEDOUT') {
          errorMessage = 'Timeout na conexão. O serviço pode estar lento ou indisponível.';
        } else if (apiError.response) {
          if (apiError.response.status === 401) {
            errorMessage = 'Token de autenticação inválido ou expirado.';
          } else if (apiError.response.status === 403) {
            errorMessage = 'Acesso negado. Verifique as permissões do token.';
          } else if (apiError.response.status === 404) {
            errorMessage = 'Endpoint não encontrado. Verifique a URL base.';
          } else {
            errorMessage = `Erro HTTP ${apiError.response.status}: ${apiError.response.statusText}`;
          }
        }

        res.status(200).json({
          success: false,
          message: errorMessage,
          details: apiError.message
        });
      }

    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/settings/webchat-snippet
  // Obter snippet do webchat (público)
  static async getWebchatSnippet(req: Request, res: Response): Promise<void> {
    try {
      const settings = await SettingsModel.findFirst();
      
      if (!settings || !settings.webchat_snippet_id) {
        res.status(404).json({
          error: 'Snippet do webchat não configurado'
        });
        return;
      }

      // Gerar snippet de código JavaScript
      const snippet = `
<!-- Webchat da Plataforma Omnichannel -->
<script>
  (function() {
    var chatWidget = document.createElement('div');
    chatWidget.id = 'omnichannel-webchat';
    chatWidget.style.cssText = 'position:fixed;bottom:20px;right:20px;width:350px;height:500px;border:none;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:9999;background:#fff;';
    
    var iframe = document.createElement('iframe');
    iframe.src = 'https://chat.plataforma-omnichannel.com/widget/${settings.webchat_snippet_id}';
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:10px;';
    iframe.allow = 'microphone; camera';
    
    chatWidget.appendChild(iframe);
    document.body.appendChild(chatWidget);
    
    // Botão de minimizar/maximizar
    var toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '💬';
    toggleBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border:none;border-radius:50%;background:#007bff;color:white;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:10000;display:none;';
    
    toggleBtn.onclick = function() {
      if (chatWidget.style.display === 'none') {
        chatWidget.style.display = 'block';
        toggleBtn.style.display = 'none';
      }
    };
    
    // Botão de fechar no widget
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;width:30px;height:30px;border:none;border-radius:50%;background:rgba(0,0,0,0.1);color:#666;font-size:18px;cursor:pointer;z-index:10001;';
    
    closeBtn.onclick = function() {
      chatWidget.style.display = 'none';
      toggleBtn.style.display = 'block';
    };
    
    chatWidget.appendChild(closeBtn);
    document.body.appendChild(toggleBtn);
  })();
</script>
<!-- Fim do Webchat -->`.trim();

      res.status(200).json({
        message: 'Snippet do webchat obtido com sucesso',
        snippet: snippet,
        snippetId: settings.webchat_snippet_id
      });

    } catch (error) {
      console.error('Erro ao obter snippet do webchat:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/settings/regenerate-snippet
  // Regenerar ID do snippet do webchat (apenas para ADMIN)
  static async regenerateSnippet(req: Request, res: Response): Promise<void> {
    try {
      // Gerar novo ID único para o snippet
      const newSnippetId = `wc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Verificar se já existe configuração
      const existingSettings = await SettingsModel.findFirst();
      
      let settings;
      if (existingSettings) {
        // Atualizar configuração existente
        settings = await SettingsModel.update(existingSettings.id, {
          webchat_snippet_id: newSnippetId
        });
      } else {
        // Criar nova configuração
        settings = await SettingsModel.create({
          webchat_snippet_id: newSnippetId
        });
      }

      if (!settings) {
        res.status(500).json({
          error: 'Erro ao regenerar snippet'
        });
        return;
      }

      res.status(200).json({
        message: 'Snippet regenerado com sucesso',
        snippetId: newSnippetId
      });

    } catch (error) {
      console.error('Erro ao regenerar snippet:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}


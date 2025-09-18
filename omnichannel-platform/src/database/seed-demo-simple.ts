import { query } from './connection';
import bcrypt from 'bcrypt';

export class DemoSeeder {
  
  static async seedDemoData(): Promise<void> {
    try {
      console.log('🌱 Iniciando seeding dos dados de demonstração...');
      
      // Gerar hash da senha demo123
      const demoPassword = await bcrypt.hash('demo123', 10);
      console.log('🔐 Senha demo gerada');
      
      // Limpar dados existentes primeiro
      await this.clearDemoData();
      
      // Inserir equipe de demonstração
      const teamResult = await query(`
        INSERT INTO teams (id, name, created_at)
        VALUES (gen_random_uuid(), 'Equipe Demonstração', NOW())
        RETURNING id;
      `);
      const teamId = teamResult.rows[0].id;
      console.log('👥 Equipe criada:', teamId);
      
      // Inserir usuários
      await query(`
        INSERT INTO users (id, email, full_name, encrypted_password, role, team_id, is_two_factor_enabled, created_at)
        VALUES 
          (gen_random_uuid(), 'demo@plataforma.com', 'Administrador Demo', $1, 'ADMIN', NULL, false, NOW()),
          (gen_random_uuid(), 'atendente@plataforma.com', 'Atendente Teste', $1, 'AGENT', $2, false, NOW()),
          (gen_random_uuid(), 'supervisor@plataforma.com', 'Supervisor Teste', $1, 'SUPERVISOR', $2, false, NOW());
      `, [demoPassword, teamId]);
      console.log('👤 Usuários criados');
      
      // Inserir mensagens do sistema
      await query(`
        INSERT INTO system_messages (id, message_key, content, created_at)
        VALUES 
          (gen_random_uuid(), 'WELCOME_MESSAGE', 'Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração. Como posso ajudá-lo hoje?', NOW()),
          (gen_random_uuid(), 'TRANSFER_TO_AGENT_MESSAGE', 'Vou transferir você para um de nossos atendentes especializados. Por favor, aguarde um momento...', NOW()),
          (gen_random_uuid(), 'BOT_ERROR_MESSAGE', 'Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e resolveremos isso rapidamente.', NOW()),
          (gen_random_uuid(), 'CONVERSATION_CLOSED_MESSAGE', 'Obrigado por entrar em contato conosco! Tenha um ótimo dia! 😊', NOW()),
          (gen_random_uuid(), 'AGENT_UNAVAILABLE_MESSAGE', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos em breve.', NOW()),
          (gen_random_uuid(), 'QUEUE_POSITION_MESSAGE', 'Você está na posição {position} da fila. Tempo estimado de espera: {estimated_time} minutos.', NOW());
      `);
      console.log('💬 Mensagens do sistema inseridas');
      
      // Inserir ações de escrita (apenas POST e PUT são permitidos)
      await query(`
        INSERT INTO write_actions (id, name, http_method, endpoint, request_body_template, is_active, created_at)
        VALUES 
          (gen_random_uuid(), 'Atualizar Dados de Contato', 'POST', '/clientes/{cpf}/contato', '{"email": "{email}", "telefone": "{telefone}"}', true, NOW()),
          (gen_random_uuid(), 'Consultar Cliente', 'POST', '/clientes/{cpf}', '{}', true, NOW()),
          (gen_random_uuid(), 'Consultar Faturas', 'POST', '/faturas/{cpf}', '{}', true, NOW());
      `);
      console.log('🔧 Ações de escrita inseridas');
      
      // Inserir fluxo de chatbot
      const flowData = {
        "nodes": [
          {
            "id": "start",
            "type": "message",
            "data": {
              "content": "Olá! Sou o assistente virtual da Empresa Demonstração. Para melhor atendê-lo, preciso do seu CPF.",
              "nextNodeId": "collect_cpf"
            },
            "position": {"x": 100, "y": 100}
          },
          {
            "id": "collect_cpf",
            "type": "collectInfo",
            "data": {
              "userMessage": "Por favor, digite seu CPF (apenas números):",
              "variableName": "cpf",
              "validationRegex": "^[0-9]{11}$",
              "errorMessage": "CPF deve conter exatamente 11 dígitos.",
              "nextNodeId": "query_customer"
            },
            "position": {"x": 300, "y": 100}
          },
          {
            "id": "query_customer",
            "type": "writeAction",
            "data": {
              "actionName": "Consultar Cliente",
              "successNodeId": "show_customer_data",
              "errorNodeId": "customer_not_found"
            },
            "position": {"x": 500, "y": 100}
          },
          {
            "id": "show_customer_data",
            "type": "message",
            "data": {
              "content": "Encontrei seus dados! Nome: {customer_name}, Email: {customer_email}. Como posso ajudá-lo?",
              "nextNodeId": "main_menu"
            },
            "position": {"x": 700, "y": 100}
          },
          {
            "id": "customer_not_found",
            "type": "message",
            "data": {
              "content": "Não encontrei seus dados em nosso sistema. Vou transferir você para um atendente.",
              "nextNodeId": "transfer"
            },
            "position": {"x": 500, "y": 300}
          },
          {
            "id": "main_menu",
            "type": "menu",
            "data": {
              "content": "Escolha uma opção:",
              "options": [
                {"text": "Consultar faturas", "nextNodeId": "query_invoices"},
                {"text": "Atualizar dados", "nextNodeId": "update_data"},
                {"text": "Falar com atendente", "nextNodeId": "transfer"}
              ]
            },
            "position": {"x": 900, "y": 100}
          },
          {
            "id": "transfer",
            "type": "transfer",
            "data": {
              "content": "Transferindo para atendente humano..."
            },
            "position": {"x": 700, "y": 400}
          }
        ]
      };
      
      await query(`
        INSERT INTO chatbot_flows (id, name, flow_definition, is_active)
        VALUES (
          gen_random_uuid(),
          'Fluxo de Demonstração',
          $1,
          true
        );
      `, [JSON.stringify(flowData)]);
      console.log('🤖 Fluxo de chatbot inserido');
      
      // Buscar IDs dos usuários para as conversas
      const agentResult = await query(`
        SELECT id FROM users WHERE email = 'atendente@plataforma.com' LIMIT 1;
      `);
      const agentId = agentResult.rows[0]?.id;
      
      // Buscar channel_id do WhatsApp
      const channelResult = await query(`
        SELECT id FROM channels WHERE type = 'WHATSAPP' LIMIT 1;
      `);
      const whatsappChannelId = channelResult.rows[0]?.id;
      
      const webChannelResult = await query(`
        SELECT id FROM channels WHERE type = 'WEBCHAT' LIMIT 1;
      `);
      const webChannelId = webChannelResult.rows[0]?.id;
      
      // Inserir conversas de exemplo
      const conversationResults = await query(`
        INSERT INTO conversations (id, customer_identifier, channel_id, status, assignee_id, created_at)
        VALUES 
          (gen_random_uuid(), '+5511999998888', $1, 'CLOSED', $2, NOW() - INTERVAL '2 hours'),
          (gen_random_uuid(), '+5522888887777', $1, 'OPEN', $2, NOW() - INTERVAL '30 minutes'),
          (gen_random_uuid(), '+5533777776666', $3, 'QUEUED', NULL, NOW() - INTERVAL '10 minutes')
        RETURNING id, customer_identifier, created_at;
      `, [whatsappChannelId, agentId, webChannelId]);
      console.log('💬 Conversas de exemplo inseridas');
      
      // Inserir mensagens de exemplo
      for (const conv of conversationResults.rows) {
        if (conv.customer_identifier === '+5511999998888') {
          await query(`
            INSERT INTO messages (id, conversation_id, content, sender_type, sender_id, created_at)
            VALUES 
              (gen_random_uuid(), $1, 'Olá, preciso de ajuda com minha conta', 'CUSTOMER', NULL, $2),
              (gen_random_uuid(), $1, 'Olá! Como posso ajudá-la hoje?', 'AGENT', $3, $4);
          `, [conv.id, new Date(conv.created_at.getTime() + 60000), agentId, new Date(conv.created_at.getTime() + 120000)]);
        }
      }
      
      // Atualizar timestamps das conversas fechadas
      await query(`
        UPDATE conversations 
        SET 
          first_agent_response_at = created_at + INTERVAL '2 minutes',
          closed_at = created_at + INTERVAL '1 hour'
        WHERE status = 'CLOSED' AND first_agent_response_at IS NULL;
      `);
      
      console.log('✅ Dados de demonstração inseridos com sucesso!');
      console.log('');
      console.log('👤 Usuários criados:');
      console.log('   📧 demo@plataforma.com (Admin) - Senha: demo123');
      console.log('   📧 atendente@plataforma.com (Agent) - Senha: demo123');
      console.log('   📧 supervisor@plataforma.com (Supervisor) - Senha: demo123');
      console.log('');
      console.log('🏢 Empresa: Empresa Demonstração Ltda');
      console.log('👥 Equipe: Equipe Demonstração');
      console.log('🤖 Fluxo: Fluxo de Demonstração (ativo)');
      console.log('💬 Conversas de exemplo criadas');
      console.log('⚙️ Ações de escrita configuradas');
      console.log('');
      console.log('🎯 Para ativar o Modo Demo, faça login com demo@plataforma.com');
      
    } catch (error) {
      console.error('❌ Erro ao executar seeding:', error);
      throw error;
    }
  }
  
  static async clearDemoData(): Promise<void> {
    try {
      console.log('🧹 Limpando dados de demonstração...');
      
      // Remover dados de demo (em ordem para respeitar foreign keys)
      await query(`
        DELETE FROM messages WHERE conversation_id IN (
          SELECT id FROM conversations WHERE customer_identifier IN ('+5511999998888', '+5522888887777', '+5533777776666')
        );
        
        DELETE FROM conversation_variables WHERE conversation_id IN (
          SELECT id FROM conversations WHERE customer_identifier IN ('+5511999998888', '+5522888887777', '+5533777776666')
        );
        
        DELETE FROM conversations WHERE customer_identifier IN ('+5511999998888', '+5522888887777', '+5533777776666');
        
        DELETE FROM chatbot_flows WHERE name = 'Fluxo de Demonstração';
        
        DELETE FROM write_actions WHERE name IN ('Atualizar Dados de Contato', 'Consultar Cliente', 'Consultar Faturas');
        
        DELETE FROM system_messages WHERE message_key IN ('WELCOME_MESSAGE', 'TRANSFER_TO_AGENT_MESSAGE', 'BOT_ERROR_MESSAGE', 'CONVERSATION_CLOSED_MESSAGE', 'AGENT_UNAVAILABLE_MESSAGE', 'QUEUE_POSITION_MESSAGE');
        
        DELETE FROM users WHERE email IN ('demo@plataforma.com', 'atendente@plataforma.com', 'supervisor@plataforma.com');
        
        DELETE FROM teams WHERE name = 'Equipe Demonstração';
      `);
      
      console.log('✅ Dados de demonstração removidos com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados de demo:', error);
      // Não fazer throw aqui para permitir que o seeding continue
    }
  }
}

// Executar seeding se chamado diretamente
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'clear') {
    DemoSeeder.clearDemoData()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    DemoSeeder.seedDemoData()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}


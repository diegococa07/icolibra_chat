-- Script de Seeding para Modo de Demonstração
-- Execute este script para popular o banco com dados fictícios para demonstração

-- Inserir usuário Admin Demo
INSERT INTO users (id, email, full_name, encrypted_password, role, is_two_factor_enabled, created_at)
VALUES (
  gen_random_uuid(),
  'demo@plataforma.com',
  'Administrador Demo',
  '$2b$10$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO', -- senha: demo123
  'ADMIN',
  false,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir equipe de demonstração
INSERT INTO teams (id, name, created_at)
VALUES (
  gen_random_uuid(),
  'Equipe Demonstração',
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Inserir usuário Atendente Demo
INSERT INTO users (id, email, full_name, encrypted_password, role, team_id, is_two_factor_enabled, created_at)
VALUES (
  gen_random_uuid(),
  'atendente@plataforma.com',
  'Atendente Teste',
  '$2b$10$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO', -- senha: demo123
  'AGENT',
  (SELECT id FROM teams WHERE name = 'Equipe Demonstração' LIMIT 1),
  false,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário Supervisor Demo
INSERT INTO users (id, email, full_name, encrypted_password, role, team_id, is_two_factor_enabled, created_at)
VALUES (
  gen_random_uuid(),
  'supervisor@plataforma.com',
  'Supervisor Teste',
  '$2b$10$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO', -- senha: demo123
  'SUPERVISOR',
  (SELECT id FROM teams WHERE name = 'Equipe Demonstração' LIMIT 1),
  false,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir configurações básicas do sistema
INSERT INTO settings (id, key, value, created_at)
VALUES 
  (gen_random_uuid(), 'company_name', 'Empresa Demonstração Ltda', NOW()),
  (gen_random_uuid(), 'erp_api_url', 'https://api-erp-demo.exemplo.com', NOW()),
  (gen_random_uuid(), 'erp_api_key', 'demo-api-key-12345', NOW()),
  (gen_random_uuid(), 'whatsapp_token', 'demo-whatsapp-token', NOW()),
  (gen_random_uuid(), 'whatsapp_phone_id', 'demo-phone-id', NOW())
ON CONFLICT (key) DO NOTHING;

-- Inserir mensagens do sistema personalizadas para demo
INSERT INTO system_messages (id, message_key, content, created_at)
VALUES 
  (gen_random_uuid(), 'WELCOME_MESSAGE', 'Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração. Como posso ajudá-lo hoje?', NOW()),
  (gen_random_uuid(), 'TRANSFER_TO_AGENT_MESSAGE', 'Vou transferir você para um de nossos atendentes especializados. Por favor, aguarde um momento...', NOW()),
  (gen_random_uuid(), 'ERROR_MESSAGE', 'Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e resolveremos isso rapidamente.', NOW()),
  (gen_random_uuid(), 'GOODBYE_MESSAGE', 'Obrigado por entrar em contato conosco! Tenha um ótimo dia! 😊', NOW()),
  (gen_random_uuid(), 'BUSINESS_HOURS_MESSAGE', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos em breve.', NOW()),
  (gen_random_uuid(), 'QUEUE_MESSAGE', 'Você está na posição {position} da fila. Tempo estimado de espera: {wait_time} minutos.', NOW())
ON CONFLICT (message_key) DO NOTHING;

-- Inserir ações de escrita para demonstração
INSERT INTO write_actions (id, name, description, endpoint_url, http_method, request_template, is_active, created_at)
VALUES 
  (gen_random_uuid(), 'Atualizar Dados de Contato', 'Atualiza email e telefone do cliente no ERP', '/clientes/{cpf}/contato', 'POST', '{"email": "{email}", "telefone": "{telefone}"}', true, NOW()),
  (gen_random_uuid(), 'Consultar Cliente', 'Busca dados do cliente no ERP por CPF', '/clientes/{cpf}', 'GET', '{}', true, NOW()),
  (gen_random_uuid(), 'Consultar Faturas', 'Busca faturas em aberto do cliente', '/faturas/{cpf}', 'GET', '{}', true, NOW())
ON CONFLICT (name) DO NOTHING;

-- Inserir fluxo de chatbot de demonstração
INSERT INTO chatbot_flows (id, name, description, flow_data, is_published, created_at)
VALUES (
  gen_random_uuid(),
  'Fluxo de Demonstração',
  'Fluxo completo para demonstração com consulta de dados e atualização cadastral',
  '{
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
          "validationType": "text",
          "variableName": "cpf",
          "errorMessage": "CPF inválido. Digite apenas os números do CPF.",
          "nextNodeId": "check_client"
        },
        "position": {"x": 100, "y": 200}
      },
      {
        "id": "check_client",
        "type": "executeWriteAction",
        "data": {
          "writeActionId": "consultar-cliente",
          "successNodeId": "menu_options",
          "errorNodeId": "client_not_found"
        },
        "position": {"x": 100, "y": 300}
      },
      {
        "id": "client_not_found",
        "type": "message",
        "data": {
          "content": "CPF não encontrado em nossa base. Vou transferir você para um atendente.",
          "nextNodeId": "transfer"
        },
        "position": {"x": 300, "y": 300}
      },
      {
        "id": "menu_options",
        "type": "options",
        "data": {
          "content": "Olá {nome}! Como posso ajudá-lo hoje?",
          "options": [
            {"text": "Consultar Faturas", "nextNodeId": "check_invoices"},
            {"text": "Atualizar Dados", "nextNodeId": "update_data"},
            {"text": "Falar com Atendente", "nextNodeId": "transfer"}
          ]
        },
        "position": {"x": 100, "y": 400}
      },
      {
        "id": "check_invoices",
        "type": "executeWriteAction",
        "data": {
          "writeActionId": "consultar-faturas",
          "successNodeId": "show_invoices",
          "errorNodeId": "invoice_error"
        },
        "position": {"x": 300, "y": 500}
      },
      {
        "id": "show_invoices",
        "type": "message",
        "data": {
          "content": "Suas faturas em aberto: {faturas}",
          "nextNodeId": "menu_options"
        },
        "position": {"x": 300, "y": 600}
      },
      {
        "id": "update_data",
        "type": "collectInfo",
        "data": {
          "userMessage": "Digite seu novo email:",
          "validationType": "email",
          "variableName": "email",
          "errorMessage": "Email inválido. Digite um email válido.",
          "nextNodeId": "collect_phone"
        },
        "position": {"x": 500, "y": 500}
      },
      {
        "id": "collect_phone",
        "type": "collectInfo",
        "data": {
          "userMessage": "Digite seu novo telefone:",
          "validationType": "phone",
          "variableName": "telefone",
          "errorMessage": "Telefone inválido. Digite um telefone válido.",
          "nextNodeId": "update_contact"
        },
        "position": {"x": 500, "y": 600}
      },
      {
        "id": "update_contact",
        "type": "executeWriteAction",
        "data": {
          "writeActionId": "atualizar-dados-contato",
          "successNodeId": "update_success",
          "errorNodeId": "update_error"
        },
        "position": {"x": 500, "y": 700}
      },
      {
        "id": "update_success",
        "type": "message",
        "data": {
          "content": "Dados atualizados com sucesso! ✅",
          "nextNodeId": "menu_options"
        },
        "position": {"x": 500, "y": 800}
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
  }',
  true,
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Inserir conversas de exemplo para demonstração
INSERT INTO conversations (id, customer_phone, customer_name, channel, status, assigned_agent_id, created_at)
VALUES 
  (gen_random_uuid(), '+5511999998888', 'Maria Adimplente', 'WHATSAPP', 'CLOSED', (SELECT id FROM users WHERE email = 'atendente@plataforma.com' LIMIT 1), NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '+5522888887777', 'João Inadimplente', 'WHATSAPP', 'OPEN', (SELECT id FROM users WHERE email = 'atendente@plataforma.com' LIMIT 1), NOW() - INTERVAL '30 minutes'),
  (gen_random_uuid(), '+5533777776666', 'Cliente Teste', 'WEBCHAT', 'WAITING', NULL, NOW() - INTERVAL '10 minutes');

-- Inserir mensagens de exemplo
INSERT INTO messages (id, conversation_id, content, sender_type, sender_id, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Olá, preciso de ajuda com minha conta',
  'CUSTOMER',
  NULL,
  c.created_at + INTERVAL '1 minute'
FROM conversations c
WHERE c.customer_name = 'Maria Adimplente';

INSERT INTO messages (id, conversation_id, content, sender_type, sender_id, created_at)
SELECT 
  gen_random_uuid(),
  c.id,
  'Olá Maria! Como posso ajudá-la hoje?',
  'AGENT',
  (SELECT id FROM users WHERE email = 'atendente@plataforma.com' LIMIT 1),
  c.created_at + INTERVAL '2 minutes'
FROM conversations c
WHERE c.customer_name = 'Maria Adimplente';

-- Atualizar first_agent_response_at para conversas fechadas
UPDATE conversations 
SET first_agent_response_at = created_at + INTERVAL '2 minutes'
WHERE status = 'CLOSED' AND first_agent_response_at IS NULL;

-- Atualizar closed_at para conversas fechadas
UPDATE conversations 
SET closed_at = created_at + INTERVAL '1 hour'
WHERE status = 'CLOSED' AND closed_at IS NULL;

COMMIT;


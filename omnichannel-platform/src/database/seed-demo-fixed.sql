-- Script de Seeding para Modo de Demonstração (CORRIGIDO)
-- Execute este script para popular o banco com dados fictícios para demonstração

BEGIN;

-- Limpar dados existentes de demonstração (opcional)
DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE customer_name IN ('Maria Adimplente', 'João Inadimplente', 'Cliente Teste'));
DELETE FROM conversations WHERE customer_name IN ('Maria Adimplente', 'João Inadimplente', 'Cliente Teste');
DELETE FROM users WHERE email IN ('demo@plataforma.com', 'atendente@plataforma.com', 'supervisor@plataforma.com');
DELETE FROM teams WHERE name = 'Equipe Demonstração';

-- Inserir equipe de demonstração primeiro
INSERT INTO teams (id, name, created_at)
VALUES (
  gen_random_uuid(),
  'Equipe Demonstração',
  NOW()
);

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
);

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
);

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
);

-- Inserir configurações básicas do sistema (sem ON CONFLICT)
INSERT INTO settings (id, key, value, created_at)
SELECT gen_random_uuid(), 'company_name', 'Empresa Demonstração Ltda', NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'company_name');

INSERT INTO settings (id, key, value, created_at)
SELECT gen_random_uuid(), 'erp_api_url', 'https://api-erp-demo.exemplo.com', NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'erp_api_url');

INSERT INTO settings (id, key, value, created_at)
SELECT gen_random_uuid(), 'erp_api_key', 'demo-api-key-12345', NOW()
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'erp_api_key');

-- Inserir mensagens do sistema personalizadas para demo (sem ON CONFLICT)
INSERT INTO system_messages (id, message_key, content, created_at)
SELECT gen_random_uuid(), 'WELCOME_MESSAGE', 'Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração. Como posso ajudá-lo hoje?', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_messages WHERE message_key = 'WELCOME_MESSAGE');

INSERT INTO system_messages (id, message_key, content, created_at)
SELECT gen_random_uuid(), 'TRANSFER_TO_AGENT_MESSAGE', 'Vou transferir você para um de nossos atendentes especializados. Por favor, aguarde um momento...', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_messages WHERE message_key = 'TRANSFER_TO_AGENT_MESSAGE');

INSERT INTO system_messages (id, message_key, content, created_at)
SELECT gen_random_uuid(), 'ERROR_MESSAGE', 'Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e resolveremos isso rapidamente.', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_messages WHERE message_key = 'ERROR_MESSAGE');

-- Inserir ações de escrita para demonstração (sem ON CONFLICT)
INSERT INTO write_actions (id, name, description, endpoint_url, http_method, request_template, is_active, created_at)
SELECT gen_random_uuid(), 'Atualizar Dados de Contato', 'Atualiza email e telefone do cliente no ERP', '/clientes/{cpf}/contato', 'POST', '{"email": "{email}", "telefone": "{telefone}"}', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM write_actions WHERE name = 'Atualizar Dados de Contato');

INSERT INTO write_actions (id, name, description, endpoint_url, http_method, request_template, is_active, created_at)
SELECT gen_random_uuid(), 'Consultar Cliente', 'Busca dados do cliente no ERP por CPF', '/clientes/{cpf}', 'GET', '{}', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM write_actions WHERE name = 'Consultar Cliente');

-- Inserir fluxo de chatbot de demonstração (sem ON CONFLICT)
INSERT INTO chatbot_flows (id, name, description, flow_data, is_published, created_at)
SELECT 
  gen_random_uuid(),
  'Fluxo de Demonstração',
  'Fluxo completo para demonstração com consulta de dados e atualização cadastral',
  '{
    "nodes": [
      {
        "id": "start",
        "type": "message",
        "data": {
          "content": "Olá! Sou o assistente virtual da Empresa Demonstração. Como posso ajudá-lo hoje?",
          "nextNodeId": "menu_options"
        },
        "position": {"x": 100, "y": 100}
      },
      {
        "id": "menu_options",
        "type": "options",
        "data": {
          "content": "Escolha uma das opções abaixo:",
          "options": [
            {"text": "2ª Via de Fatura", "nextNodeId": "collect_cpf"},
            {"text": "Falar com Atendente", "nextNodeId": "transfer"}
          ]
        },
        "position": {"x": 100, "y": 200}
      },
      {
        "id": "collect_cpf",
        "type": "collectInfo",
        "data": {
          "userMessage": "Por favor, digite seu CPF (apenas números):",
          "validationType": "text",
          "variableName": "cpf",
          "errorMessage": "CPF inválido. Digite apenas os números do CPF.",
          "nextNodeId": "check_invoices"
        },
        "position": {"x": 300, "y": 300}
      },
      {
        "id": "check_invoices",
        "type": "message",
        "data": {
          "content": "Consultando suas faturas... ⏳",
          "nextNodeId": "show_result"
        },
        "position": {"x": 300, "y": 400}
      },
      {
        "id": "show_result",
        "type": "message",
        "data": {
          "content": "Baseado no CPF informado, não encontramos faturas em aberto. Você está em dia! ✅",
          "nextNodeId": "end"
        },
        "position": {"x": 300, "y": 500}
      },
      {
        "id": "transfer",
        "type": "transfer",
        "data": {
          "content": "Aguarde, um de nossos especialistas irá te ajudar..."
        },
        "position": {"x": 500, "y": 300}
      },
      {
        "id": "end",
        "type": "message",
        "data": {
          "content": "Obrigado por utilizar nossos serviços! 😊"
        },
        "position": {"x": 300, "y": 600}
      }
    ]
  }',
  true,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM chatbot_flows WHERE name = 'Fluxo de Demonstração');

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

-- Exibir resumo dos dados inseridos
SELECT 'Usuários criados:' as info, count(*) as total FROM users WHERE email LIKE '%@plataforma.com';
SELECT 'Equipes criadas:' as info, count(*) as total FROM teams WHERE name = 'Equipe Demonstração';
SELECT 'Conversas criadas:' as info, count(*) as total FROM conversations WHERE customer_name IN ('Maria Adimplente', 'João Inadimplente', 'Cliente Teste');
SELECT 'Fluxos criados:' as info, count(*) as total FROM chatbot_flows WHERE name = 'Fluxo de Demonstração';


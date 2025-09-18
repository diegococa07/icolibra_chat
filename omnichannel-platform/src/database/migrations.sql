-- Migration: Criação do esquema inicial da Plataforma Omnichannel
-- Data: 2024-12-15
-- Descrição: Criação das tabelas principais conforme especificado no Prompt 01

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela users: Armazena os dados de todos os usuários do sistema (Admins e Atendentes)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    encrypted_password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AGENT')),
    two_factor_secret TEXT,
    is_two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela settings: Configurações globais da conta do cliente
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp_api_key TEXT,
    whatsapp_endpoint_url TEXT,
    erp_api_base_url TEXT,
    erp_api_auth_token TEXT,
    webchat_snippet_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela channels: Informações dos canais de comunicação ativos
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('WHATSAPP', 'WEBCHAT')),
    is_active BOOLEAN DEFAULT true
);

-- Tabela conversations: Rastreia cada sessão de conversa
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_identifier TEXT,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('BOT', 'QUEUED', 'OPEN', 'CLOSED')),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    queue TEXT,
    external_protocol TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela messages: Armazena cada mensagem individual de uma conversa
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('CUSTOMER', 'BOT', 'AGENT')),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content_type TEXT DEFAULT 'text',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela chatbot_flows: Estrutura dos fluxos criados no construtor visual
CREATE TABLE IF NOT EXISTS chatbot_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    flow_definition JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assignee_id ON conversations(assignee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_is_active ON chatbot_flows(is_active);

-- Trigger para atualizar updated_at na tabela settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Armazena dados de usuários do sistema (Admins e Atendentes)';
COMMENT ON TABLE settings IS 'Configurações globais da conta do cliente';
COMMENT ON TABLE channels IS 'Canais de comunicação ativos';
COMMENT ON TABLE conversations IS 'Sessões de conversa entre clientes e sistema';
COMMENT ON TABLE messages IS 'Mensagens individuais das conversas';
COMMENT ON TABLE chatbot_flows IS 'Fluxos do chatbot criados no construtor visual';

-- Inserir dados iniciais
-- Canal padrão do WhatsApp
INSERT INTO channels (type, is_active) 
VALUES ('WHATSAPP', true) 
ON CONFLICT DO NOTHING;

-- Canal padrão do Webchat
INSERT INTO channels (type, is_active) 
VALUES ('WEBCHAT', true) 
ON CONFLICT DO NOTHING;

-- Configurações iniciais (registro único)
INSERT INTO settings (id) 
VALUES (uuid_generate_v4()) 
ON CONFLICT DO NOTHING;



-- ========================================
-- PROMPT 09: PERFIL DE SUPERVISOR
-- Data: 2024-12-15
-- Descrição: Implementação do perfil de Supervisor com gestão de equipes
-- ========================================

-- Tabela teams: Armazena as equipes de atendimento
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela users para incluir team_id e role SUPERVISOR
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'AGENT', 'SUPERVISOR'));

-- Adicionar coluna team_id à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Inserir equipe padrão
INSERT INTO teams (id, name) 
VALUES (uuid_generate_v4(), 'Equipe Padrão')
ON CONFLICT DO NOTHING;


-- ========================================
-- PROMPT 10: CUSTOMIZAÇÃO DE MENSAGENS
-- Data: 2024-12-15
-- Descrição: Sistema de mensagens customizáveis pelo administrador
-- ========================================

-- Tabela system_messages: Armazena mensagens customizáveis do sistema
CREATE TABLE IF NOT EXISTS system_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_messages_key ON system_messages(message_key);

-- Inserir mensagens padrão do sistema
INSERT INTO system_messages (message_key, content, description) VALUES
('WELCOME_MESSAGE', 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?', 'Mensagem de boas-vindas enviada quando o cliente inicia uma conversa'),
('TRANSFER_TO_AGENT_MESSAGE', 'Vou transferir você para um de nossos atendentes. Por favor, aguarde um momento.', 'Mensagem enviada quando o bot transfere a conversa para um atendente humano'),
('AGENT_UNAVAILABLE_MESSAGE', 'No momento todos os nossos atendentes estão ocupados. Sua mensagem foi registrada e em breve entraremos em contato.', 'Mensagem enviada quando não há atendentes disponíveis'),
('CONVERSATION_CLOSED_MESSAGE', 'Obrigado pelo contato! Sua conversa foi finalizada. Se precisar de mais alguma coisa, não hesite em nos procurar.', 'Mensagem enviada quando uma conversa é encerrada'),
('BOT_ERROR_MESSAGE', 'Desculpe, ocorreu um erro. Por favor, tente novamente ou aguarde um momento para falar com um atendente.', 'Mensagem enviada quando ocorre um erro no bot'),
('QUEUE_POSITION_MESSAGE', 'Você está na posição {position} da fila. Tempo estimado de espera: {estimated_time} minutos.', 'Mensagem informando a posição na fila de atendimento')
ON CONFLICT (message_key) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_system_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_messages_updated_at
    BEFORE UPDATE ON system_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_system_messages_updated_at();


-- ========================================
-- PROMPT 11: RELATÓRIOS AVANÇADOS DE PERFORMANCE (TMA e TMR)
-- Data: 2024-12-15
-- Descrição: Implementação de métricas de Tempo Médio de Atendimento e Tempo de Primeira Resposta
-- ========================================

-- Adicionar coluna first_agent_response_at à tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS first_agent_response_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhor performance nas consultas de relatórios
CREATE INDEX IF NOT EXISTS idx_conversations_first_agent_response ON conversations(first_agent_response_at);
CREATE INDEX IF NOT EXISTS idx_conversations_closed_at ON conversations(closed_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Comentários para documentar as colunas
COMMENT ON COLUMN conversations.first_agent_response_at IS 'Timestamp da primeira resposta de um atendente humano nesta conversa';
COMMENT ON COLUMN conversations.closed_at IS 'Timestamp quando a conversa foi encerrada';
COMMENT ON COLUMN conversations.created_at IS 'Timestamp quando a conversa foi iniciada';


-- ========================================
-- PROMPT 12: ATUALIZAÇÃO CADASTRAL VIA CHATBOT
-- Data: 2024-12-15
-- Descrição: Implementação de operações de escrita (WRITE) no ERP via chatbot
-- ========================================

-- Tabela write_actions: Armazena as ações de escrita configuradas pelo Admin
CREATE TABLE IF NOT EXISTS write_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    http_method TEXT NOT NULL CHECK (http_method IN ('POST', 'PUT')),
    endpoint TEXT NOT NULL,
    request_body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela conversation_variables: Armazena variáveis de sessão das conversas
CREATE TABLE IF NOT EXISTS conversation_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    variable_name TEXT NOT NULL,
    variable_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, variable_name)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_write_actions_active ON write_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_variables_conversation ON conversation_variables(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_variables_name ON conversation_variables(variable_name);

-- Trigger para atualizar updated_at automaticamente em write_actions
CREATE OR REPLACE FUNCTION update_write_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_write_actions_updated_at
    BEFORE UPDATE ON write_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_write_actions_updated_at();

-- Trigger para atualizar updated_at automaticamente em conversation_variables
CREATE OR REPLACE FUNCTION update_conversation_variables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_variables_updated_at
    BEFORE UPDATE ON conversation_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_variables_updated_at();

-- Comentários para documentar as tabelas
COMMENT ON TABLE write_actions IS 'Ações de escrita configuradas pelo Admin para operações no ERP';
COMMENT ON COLUMN write_actions.name IS 'Nome amigável da ação (ex: "Atualizar Telefone e Email")';
COMMENT ON COLUMN write_actions.http_method IS 'Método HTTP para a ação (POST ou PUT)';
COMMENT ON COLUMN write_actions.endpoint IS 'URL relativa da API (ex: /clientes/{{customer_identifier}}/contato)';
COMMENT ON COLUMN write_actions.request_body_template IS 'Template JSON com variáveis para o corpo da requisição';

COMMENT ON TABLE conversation_variables IS 'Variáveis de sessão armazenadas durante o fluxo da conversa';
COMMENT ON COLUMN conversation_variables.variable_name IS 'Nome da variável (ex: email_cliente, telefone_cliente)';
COMMENT ON COLUMN conversation_variables.variable_value IS 'Valor da variável coletada do usuário';


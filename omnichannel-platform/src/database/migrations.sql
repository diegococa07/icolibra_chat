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


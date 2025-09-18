-- ========================================
-- PROMPT 14: GERENCIAMENTO DE TEMPLATES DE MENSAGEM (HSM)
-- Data: 2025-09-18
-- Descrição: Implementação do gerenciamento de templates de mensagem para WhatsApp
-- ========================================

-- Tabela message_templates: Armazena os templates de mensagem para WhatsApp
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    whatsapp_template_id TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_message_templates_status ON message_templates(status);
CREATE INDEX IF NOT EXISTS idx_message_templates_name ON message_templates(name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_message_templates_updated_at();

-- Comentários para documentar a tabela
COMMENT ON TABLE message_templates IS 'Templates de mensagem (HSM) para envio proativo via WhatsApp';
COMMENT ON COLUMN message_templates.name IS 'Nome interno do template (ex: "Aviso de Manutenção Programada")';
COMMENT ON COLUMN message_templates.body IS 'Corpo do template com variáveis (ex: "Olá, {{1}}. Informamos que haverá uma manutenção em {{2}} que afetará sua região.")';
COMMENT ON COLUMN message_templates.whatsapp_template_id IS 'ID oficial do template após aprovado pela Meta';
COMMENT ON COLUMN message_templates.status IS 'Status do template (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED)';


-- Criação da tabela campaigns para o Prompt 15
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    message_template_id UUID REFERENCES message_templates(id),
    target_criteria JSONB NOT NULL DEFAULT '{}',
    template_variables JSONB NOT NULL DEFAULT '{}',
    scheduled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_message_template_id ON campaigns(message_template_id);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaigns_updated_at_trigger ON campaigns;
CREATE TRIGGER update_campaigns_updated_at_trigger
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaigns_updated_at();

-- Comentários para documentação
COMMENT ON TABLE campaigns IS 'Armazena campanhas de notificação para envio em lote';
COMMENT ON COLUMN campaigns.id IS 'Identificador único da campanha';
COMMENT ON COLUMN campaigns.name IS 'Nome descritivo da campanha';
COMMENT ON COLUMN campaigns.message_template_id IS 'Referência ao template de mensagem aprovado';
COMMENT ON COLUMN campaigns.target_criteria IS 'Critérios de segmentação em formato JSON';
COMMENT ON COLUMN campaigns.template_variables IS 'Valores para as variáveis do template em formato JSON';
COMMENT ON COLUMN campaigns.scheduled_at IS 'Data e hora agendada para início do envio';
COMMENT ON COLUMN campaigns.status IS 'Status da campanha: DRAFT, SCHEDULED, SENDING, COMPLETED';


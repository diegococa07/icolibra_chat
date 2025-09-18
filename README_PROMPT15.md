# Prompt 15: Painel de Campanhas e Agendamento

## Visão Geral

Este prompt implementa um sistema completo de gerenciamento de campanhas e agendamento para envios em lote na plataforma omnichannel. O sistema permite que administradores e supervisores criem, agendem e gerenciem campanhas de notificação proativa para clientes, utilizando templates de mensagem aprovados.

## Funcionalidades Implementadas

### 1. Modelo de Dados para Campanhas

- **Tabela `campaigns`** com os seguintes campos:
  - `id` (UUID): Identificador único da campanha
  - `name` (TEXT): Nome descritivo da campanha
  - `message_template_id` (UUID): Referência ao template de mensagem aprovado
  - `target_criteria` (JSONB): Critérios de segmentação em formato JSON
  - `template_variables` (JSONB): Valores para as variáveis do template em formato JSON
  - `scheduled_at` (TIMESTAMPTZ): Data e hora agendada para início do envio
  - `status` (TEXT): Status da campanha (DRAFT, SCHEDULED, SENDING, COMPLETED)
  - `created_at` e `updated_at` (TIMESTAMPTZ): Timestamps de criação e atualização

- **Tipos TypeScript** para campanhas:
  - `CampaignStatus`: Enum com os possíveis status de campanha
  - `Campaign`: Interface para a estrutura completa da campanha
  - `CreateCampaign`: Interface para criação de novas campanhas
  - `UpdateCampaign`: Interface para atualização de campanhas existentes

### 2. API para Gerenciamento de Campanhas

- **Rotas REST** para gerenciamento de campanhas:
  - `GET /api/campaigns`: Lista todas as campanhas
  - `GET /api/campaigns/status/:status`: Lista campanhas por status
  - `GET /api/campaigns/scheduled`: Lista campanhas agendadas para um período
  - `GET /api/campaigns/:id`: Busca campanha por ID
  - `POST /api/campaigns`: Cria nova campanha
  - `PUT /api/campaigns/:id`: Atualiza campanha
  - `PATCH /api/campaigns/:id/status`: Atualiza status
  - `DELETE /api/campaigns/:id`: Remove campanha

- **Validações e Segurança**:
  - Verificação de campos obrigatórios
  - Validação de templates (existência e status APPROVED)
  - Verificação de datas de agendamento (deve ser futura)
  - Validação de status permitidos
  - Verificação de transições de status válidas
  - Proteção contra exclusão de campanhas em execução ou concluídas
  - Todas as rotas requerem autenticação e privilégios de administrador ou supervisor

### 3. Interface de Usuário para Campanhas

- **Página Principal de Campanhas** (`/dashboard/campaigns/page.tsx`):
  - Listagem completa de campanhas com filtros por status
  - Indicadores visuais para diferentes status
  - Botões de ação para editar e excluir campanhas
  - Exibição de data de agendamento e criação

- **Formulário de Criação em 4 Passos** (`/dashboard/campaigns/new/page.tsx`):
  - **Passo 1:** Informações básicas (nome e template)
  - **Passo 2:** Segmentação (região, status do cliente, última interação)
  - **Passo 3:** Variáveis do template (preenchimento dinâmico)
  - **Passo 4:** Agendamento (data, hora e resumo da campanha)
  - Validações em cada passo para garantir dados completos
  - Barra de progresso visual para acompanhamento

## Arquivos Criados/Modificados

### Backend

1. **Banco de Dados**:
   - `/src/database/migrations_prompt15.sql`: Migração para criar a tabela `campaigns`

2. **Tipos**:
   - `/src/types/index.ts`: Adicionados tipos para campanhas

3. **Modelo**:
   - `/src/models/Campaign.ts`: Implementação do modelo `CampaignModel`

4. **Controller**:
   - `/src/controllers/CampaignController.ts`: Implementação do controller para campanhas

5. **Rotas**:
   - `/src/routes/campaigns.ts`: Definição das rotas para campanhas
   - `/src/index.ts`: Adicionada importação e registro das rotas de campanhas

### Frontend

1. **API Client**:
   - `/src/lib/api-campaigns.ts`: Funções para comunicação com a API de campanhas

2. **Páginas**:
   - `/src/app/dashboard/campaigns/page.tsx`: Página principal de campanhas
   - `/src/app/dashboard/campaigns/new/page.tsx`: Formulário de criação de campanha em 4 passos

3. **Dashboard**:
   - `/src/app/dashboard/page.tsx`: Adicionado link para a página de campanhas

## Como Usar

### Acessando o Painel de Campanhas

1. Faça login como administrador ou supervisor
2. No dashboard, clique em "Ver Campanhas" ou navegue para `/dashboard/campaigns`
3. A página exibirá todas as campanhas existentes, com opções para filtrar por status

### Criando uma Nova Campanha

1. Na página de campanhas, clique em "Nova Campanha"
2. Siga os 4 passos do formulário:
   - **Passo 1**: Preencha o nome da campanha e selecione um template aprovado
   - **Passo 2**: Configure os critérios de segmentação para o público-alvo
   - **Passo 3**: Preencha as variáveis do template selecionado
   - **Passo 4**: Defina a data e hora de agendamento ou salve como rascunho
3. Clique em "Criar Campanha" para finalizar

### Gerenciando Campanhas Existentes

- Use os filtros para visualizar campanhas por status (Rascunho, Agendada, Enviando, Concluída)
- Clique no botão de edição para modificar uma campanha (apenas disponível para campanhas em rascunho ou agendadas)
- Clique no botão de exclusão para remover uma campanha (apenas disponível para campanhas em rascunho ou agendadas)

## Próximos Passos

Para completar a implementação do sistema de campanhas, será necessário implementar o Prompt 16: Motor de Envio de Campanhas (Background Job), que será responsável por:

1. Processar as campanhas agendadas
2. Buscar os destinatários no ERP com base nos critérios de segmentação
3. Substituir as variáveis do template com dados específicos de cada cliente
4. Realizar o envio em massa de forma segura e controlada
5. Atualizar o status das campanhas conforme o progresso do envio

## Conclusão

O Painel de Campanhas e Agendamento implementa a interface e a lógica necessárias para criar e gerenciar campanhas de notificação proativa. Combinado com o Gerenciamento de Templates de Mensagem (Prompt 14) e o futuro Motor de Envio de Campanhas (Prompt 16), este sistema fornece uma solução completa para comunicação proativa com clientes através de mensagens WhatsApp aprovadas pela Meta.


# Prompt 10: Customização de Mensagens pelo Administrador

**Feature**: Criação de uma interface para o Administrador personalizar as mensagens automáticas do sistema.

## Descrição Detalhada

Neste prompt, foi implementada a funcionalidade que permite ao Admin editar as mensagens padrão enviadas pelo bot, como a mensagem de boas-vindas ou de transferência.

### 1. Alterações no Modelo de Dados

- **Nova Tabela `system_messages`**:
  - `id` (UUID, Chave Primária)
  - `message_key` (TEXT, Único, Não Nulo) - Ex: `WELCOME_MESSAGE`, `TRANSFER_TO_AGENT_MESSAGE`.
  - `content` (TEXT, Não Nulo) - O texto da mensagem.
  - `description` (TEXT) - Descrição do propósito da mensagem.

### 2. Lógica de Backend

- **Atualização da Engine do Bot**:
  - A lógica do `BotEngine` foi modificada para que, em vez de usar texto fixo (hardcoded), ela consulte a tabela `system_messages` usando a `message_key` apropriada para obter o conteúdo da mensagem a ser enviada.

- **Endpoints de Gestão de Mensagens (Admin Only)**:
  - `GET /api/system-messages`: Retorna todas as mensagens customizáveis.
  - `PUT /api/system-messages/:key`: Atualiza o conteúdo (`content`) de uma mensagem específica.

### 3. Interface Visual (Frontend)

- **Nova Página de Customização de Mensagens**:
  - Criada a página `/dashboard/settings/messages`.
  - Acessível por uma nova aba "Mensagens" dentro da área de "Configurações".
  - A página lista todas as mensagens personalizáveis do sistema (ex: "Mensagem de Boas-Vindas", "Mensagem de Transferência").
  - Para cada mensagem, exibe seu nome, uma breve descrição do seu propósito, e uma área de texto (`<textarea>`) para o Admin editar o conteúdo.
  - Um botão "Salvar" ao lado de cada `textarea` para persistir a alteração.



# Plataforma de Atendimento Omnichannel

Uma solução SaaS robusta que unifica canais de comunicação digital (WhatsApp e Webchat), automatiza o atendimento com chatbot e se integra a sistemas de ERP de clientes.

## 🏗️ Arquitetura

### Stack Tecnológica
- **Backend**: Node.js com TypeScript
- **Banco de Dados**: PostgreSQL
- **Frontend**: Next.js com Tailwind CSS (a ser implementado)

### Estrutura do Projeto
```
omnichannel-platform/
├── src/
│   ├── database/           # Configuração e migrations do banco
│   ├── models/            # Modelos de dados e ORM
│   ├── controllers/       # Controladores da API
│   ├── routes/           # Rotas da API
│   ├── middleware/       # Middlewares customizados
│   ├── types/           # Definições de tipos TypeScript
│   ├── utils/           # Utilitários e helpers
│   └── index.ts         # Arquivo principal do servidor
├── package.json
├── tsconfig.json
└── README.md
```

## 📊 Modelo de Dados

### Entidades Principais

#### 1. Users
Armazena dados de usuários do sistema (Admins e Atendentes)
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `encrypted_password` (TEXT)
- `role` (ENUM: 'ADMIN', 'AGENT')
- `two_factor_secret` (TEXT)
- `is_two_factor_enabled` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### 2. Settings
Configurações globais da conta do cliente
- `id` (UUID, PK)
- `whatsapp_api_key` (TEXT)
- `whatsapp_endpoint_url` (TEXT)
- `erp_api_base_url` (TEXT)
- `erp_api_auth_token` (TEXT)
- `webchat_snippet_id` (TEXT)
- `updated_at` (TIMESTAMP)

#### 3. Channels
Canais de comunicação ativos
- `id` (UUID, PK)
- `type` (ENUM: 'WHATSAPP', 'WEBCHAT')
- `is_active` (BOOLEAN)

#### 4. Conversations
Sessões de conversa entre clientes e sistema
- `id` (UUID, PK)
- `customer_identifier` (TEXT)
- `channel_id` (UUID, FK)
- `status` (ENUM: 'BOT', 'QUEUED', 'OPEN', 'CLOSED')
- `assignee_id` (UUID, FK)
- `queue` (TEXT)
- `external_protocol` (TEXT)
- `created_at` (TIMESTAMP)
- `closed_at` (TIMESTAMP)

#### 5. Messages
Mensagens individuais das conversas
- `id` (UUID, PK)
- `conversation_id` (UUID, FK)
- `sender_type` (ENUM: 'CUSTOMER', 'BOT', 'AGENT')
- `sender_id` (UUID, FK)
- `content_type` (TEXT)
- `content` (TEXT)
- `created_at` (TIMESTAMP)

#### 6. Chatbot Flows
Fluxos do chatbot criados no construtor visual
- `id` (UUID, PK)
- `name` (TEXT)
- `flow_definition` (JSONB)
- `is_active` (BOOLEAN)

## 🚀 Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Instalação

1. **Clone o repositório e instale dependências:**
```bash
cd omnichannel-platform
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/omnichannel_platform
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omnichannel_platform
DB_USER=username
DB_PASSWORD=password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# CORS Configuration
CORS_ORIGIN=*
```

3. **Execute as migrations do banco de dados:**
```bash
npm run migrate
```

4. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Inicia o servidor em modo produção
- `npm run migrate` - Executa as migrations do banco de dados

## 🔗 API Endpoints

### Health Check
- `GET /health` - Status geral da aplicação
- `GET /health/database` - Status da conexão com banco de dados

### Próximas Features
As próximas implementações incluirão endpoints para:
- Autenticação e autorização
- Gerenciamento de usuários
- Configurações do sistema
- Gerenciamento de conversas
- Envio e recebimento de mensagens
- Configuração de fluxos de chatbot

## 🗄️ Modelos de Dados

### UserModel
- `create(userData)` - Criar novo usuário
- `findById(id)` - Buscar usuário por ID
- `findByEmail(email)` - Buscar usuário por email
- `findAll()` - Listar todos os usuários
- `findByRole(role)` - Listar usuários por role
- `update(id, updateData)` - Atualizar usuário
- `delete(id)` - Deletar usuário
- `toggleTwoFactor(id, enabled, secret)` - Ativar/desativar 2FA

### SettingsModel
- `create(settingsData)` - Criar configurações
- `get()` - Buscar configurações
- `update(updateData)` - Atualizar configurações
- `updateWhatsAppConfig(apiKey, endpointUrl)` - Atualizar config WhatsApp
- `updateERPConfig(baseUrl, authToken)` - Atualizar config ERP
- `isConfigurationComplete()` - Verificar se config está completa

### ChannelModel
- `create(channelData)` - Criar novo canal
- `findById(id)` - Buscar canal por ID
- `findByType(type)` - Buscar canal por tipo
- `findAll()` - Listar todos os canais
- `findActive()` - Listar canais ativos
- `toggleActive(id, isActive)` - Ativar/desativar canal

### ConversationModel
- `create(conversationData)` - Criar nova conversa
- `findById(id)` - Buscar conversa por ID
- `findByCustomer(customerIdentifier)` - Buscar conversas do cliente
- `findByStatus(status)` - Buscar conversas por status
- `findByAssignee(assigneeId)` - Buscar conversas do atendente
- `assignToAgent(id, assigneeId)` - Atribuir conversa a atendente
- `close(id)` - Fechar conversa
- `transferToQueue(id, queue)` - Transferir para fila

### MessageModel
- `create(messageData)` - Criar nova mensagem
- `findById(id)` - Buscar mensagem por ID
- `findByConversation(conversationId)` - Buscar mensagens da conversa
- `findBySenderType(senderType)` - Buscar mensagens por tipo de remetente
- `findLatestByConversation(conversationId)` - Buscar últimas mensagens
- `getStats()` - Estatísticas de mensagens

### ChatbotFlowModel
- `create(flowData)` - Criar novo fluxo
- `findById(id)` - Buscar fluxo por ID
- `findActive()` - Buscar fluxos ativos
- `activate(id)` - Ativar fluxo (desativa outros)
- `validateFlowDefinition(flowDefinition)` - Validar estrutura do fluxo
- `exportFlow(id)` - Exportar fluxo para JSON
- `importFlow(importData)` - Importar fluxo de JSON

## 🔧 Desenvolvimento

### Estrutura de Tipos
Todos os tipos TypeScript estão definidos em `src/types/index.ts`, incluindo:
- Enums para roles, status e tipos
- Interfaces para todas as entidades
- Tipos para criação (sem campos auto-gerados)

### Conexão com Banco
A conexão com PostgreSQL é gerenciada através de um pool de conexões em `src/database/connection.ts`, com funções utilitárias para:
- Teste de conexão
- Execução de queries
- Gerenciamento do pool

### Migrations
As migrations estão em `src/database/migrations.sql` e incluem:
- Criação de todas as tabelas
- Índices para performance
- Triggers para campos automáticos
- Dados iniciais (canais padrão)

## 📝 Próximos Passos

1. **Prompt 02**: Implementação da autenticação e autorização
2. **Prompt 03**: APIs de gerenciamento de usuários
3. **Prompt 04**: APIs de configurações do sistema
4. **Prompt 05**: APIs de gerenciamento de conversas
5. **Prompt 06**: APIs de mensagens e comunicação
6. **Prompt 07**: Sistema de chatbot e fluxos
7. **Prompt 08**: Integração com WhatsApp
8. **Prompt 09**: Integração com ERP
9. **Prompt 10**: Interface frontend com Next.js

## 🤝 Contribuição

Este projeto está sendo desenvolvido de forma incremental seguindo prompts sequenciais. Cada prompt adiciona uma nova funcionalidade completa ao sistema.

## 📄 Licença

Este projeto é propriedade da equipe de desenvolvimento e está em fase de desenvolvimento ativo.


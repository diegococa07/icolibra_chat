# Prompt 05: Construtor Visual de Fluxo do Chatbot

## ✅ Implementação Completa

Este documento descreve a implementação completa do **Construtor Visual de Fluxos (Flow Builder)** para a Plataforma de Atendimento Omnichannel.

## 🏗️ Arquitetura Implementada

### Backend (Node.js/TypeScript)

#### 1. Controlador de Fluxos (`src/controllers/FlowController.ts`)
- **10 endpoints especializados** para gerenciamento completo de fluxos
- **Validações robustas** com sanitização de inputs
- **Controle de ativação** (apenas um fluxo ativo por vez)
- **Estatísticas detalhadas** de fluxos

##### Endpoints Implementados:
- `GET /api/flows` - Listar todos os fluxos (Admin only)
- `GET /api/flows/:id` - Obter fluxo específico (Admin only)
- `POST /api/flows` - Criar novo fluxo (Admin only)
- `PUT /api/flows/:id` - Atualizar fluxo existente (Admin only)
- `DELETE /api/flows/:id` - Excluir fluxo (Admin only)
- `POST /api/flows/:id/publish` - Publicar/ativar fluxo (Admin only)
- `POST /api/flows/:id/unpublish` - Despublicar/desativar fluxo (Admin only)
- `GET /api/flows/active` - Obter fluxo ativo (Público - usado pelo chatbot)
- `GET /api/flows/stats` - Obter estatísticas dos fluxos (Admin only)

#### 2. Modelo de Dados Expandido (`src/models/ChatbotFlow.ts`)
- **Método findActive()** para obter fluxo ativo único
- **Controle de ativação** com desativação automática de outros fluxos
- **Validações de integridade** antes de operações
- **Métodos especializados** para cada operação

#### 3. Rotas Protegidas (`src/routes/flows.ts`)
- Todas as rotas administrativas protegidas com `requireAdmin`
- Endpoint público para obter fluxo ativo
- Documentação completa de cada endpoint

### Frontend (Next.js/TypeScript/Tailwind CSS + React Flow)

#### 1. Cliente API Expandido (`src/lib/api.ts`)
- **flowsAPI**: Conjunto completo de funções para fluxos
- **Tipos TypeScript** para todas as interfaces
- **Tratamento de erros** padronizado

#### 2. Página do Construtor Visual (`/dashboard/flow-builder`)

##### Layout em 3 Painéis:

###### Painel de Nós (Esquerda):
- **4 tipos de nós** disponíveis para arrastar
- **Ícones visuais** para cada tipo
- **Status do fluxo** em tempo real
- **Estatísticas** de nós e conexões

###### Canvas/Área de Desenho (Centro):
- **React Flow** integrado com zoom e pan
- **Arrastar e soltar** nós do painel
- **Conectar nós** criando arestas
- **Seleção visual** de nós
- **MiniMap e controles** de navegação

###### Painel de Propriedades (Direita):
- **Configuração contextual** do nó selecionado
- **Formulários específicos** para cada tipo de nó
- **Ações de duplicar e excluir** nós
- **Validação em tempo real**

## 🎨 Tipos de Nós Implementados

### 1. **Enviar Mensagem** (sendMessage)
- **Cor**: Azul
- **Ícone**: MessageSquare
- **Propriedades**:
  - Campo de texto grande para a mensagem
  - Suporte a texto multilinha
  - Preview da mensagem no nó

### 2. **Menu com Botões** (menuButtons)
- **Cor**: Verde
- **Ícone**: Menu
- **Propriedades**:
  - Mensagem principal (pergunta)
  - Até 3 botões configuráveis
  - Cada botão gera um ponto de saída
  - Preview do número de botões

### 3. **Ação de Integração** (integration)
- **Cor**: Roxo
- **Ícone**: Zap
- **Propriedades**:
  - Dropdown com ações predefinidas:
    - Buscar Fatura por CPF
    - Consultar Histórico
    - Verificar Status
    - Buscar Produto
  - Campo de entrada (ex: CPF)
  - Dois pontos de saída: "Sucesso" e "Falha"

### 4. **Transferir para Atendente** (transfer)
- **Cor**: Laranja
- **Ícone**: Users
- **Propriedades**:
  - Dropdown com filas predefinidas:
    - Financeiro
    - Suporte Técnico
    - Vendas
    - Atendimento Geral
  - Preview da fila selecionada

## 🔧 Funcionalidades do Canvas

### Interações Implementadas:
- ✅ **Arrastar e Soltar**: Nós do painel para o canvas
- ✅ **Conectar Nós**: Arrastar de saída para entrada
- ✅ **Selecionar e Configurar**: Clique para editar propriedades
- ✅ **Zoom e Pan**: Navegação fluida no canvas
- ✅ **MiniMap**: Visão geral do fluxo
- ✅ **Background Grid**: Guias visuais
- ✅ **Controles**: Zoom in/out, fit view, etc.

### Ações da Barra Superior:
- ✅ **Campo Nome**: Edição do nome do fluxo
- ✅ **Botão Salvar**: Persiste o fluxo no banco
- ✅ **Botão Publicar**: Ativa o fluxo para uso
- ✅ **Botão Despublicar**: Desativa o fluxo
- ✅ **Estados de Loading**: Feedback visual durante operações

## 🔐 Recursos de Segurança

### 1. Controle de Acesso
- ✅ Todas as rotas administrativas protegidas com `requireAdmin`
- ✅ Verificação de role no frontend
- ✅ Redirecionamento automático para não-admins
- ✅ Endpoint público apenas para fluxo ativo

### 2. Validações e Integridade
- ✅ Nome do fluxo obrigatório
- ✅ Verificação de nomes únicos
- ✅ Não permite excluir fluxo ativo
- ✅ Não permite publicar fluxo vazio
- ✅ Desativação automática de outros fluxos ao publicar

### 3. Persistência Robusta
- ✅ Estrutura do fluxo salva como JSON no campo `flow_definition`
- ✅ Inclui nós, arestas e viewport
- ✅ Carregamento automático do fluxo ativo
- ✅ Recuperação completa do estado do canvas

## 📱 Interface do Usuário

### Design System
- **Framework**: Tailwind CSS + React Flow
- **Ícones**: Lucide React (MessageSquare, Menu, Zap, Users, etc.)
- **Layout**: 3 painéis responsivos
- **Feedback**: Alertas contextuais e estados de loading

### Componentes Principais
- **NodeTypes customizados** para cada tipo de nó
- **Painel de propriedades dinâmico** baseado na seleção
- **Barra de ferramentas** com ações principais
- **Status indicators** para fluxo ativo/inativo
- **Estatísticas em tempo real** de nós e conexões

### Experiência do Usuário
- **Drag & Drop intuitivo** do painel para canvas
- **Conexões visuais** com setas direcionais
- **Seleção clara** com bordas coloridas
- **Feedback imediato** para todas as ações
- **Estados de loading** durante operações
- **Mensagens de erro específicas** e acionáveis

## 🚀 Fluxos de Uso

### 1. Criar Novo Fluxo
```
1. Admin acessa /dashboard/flow-builder
2. Insere nome do fluxo no campo superior
3. Arrasta nós do painel esquerdo para o canvas
4. Conecta nós criando sequência lógica
5. Configura propriedades de cada nó
6. Clica em "Salvar" para persistir
7. Clica em "Publicar" para ativar
```

### 2. Editar Fluxo Existente
```
1. Admin acessa construtor
2. Fluxo ativo é carregado automaticamente
3. Modifica nós, conexões ou propriedades
4. Salva alterações
5. Republica se necessário
```

### 3. Configurar Nó "Enviar Mensagem"
```
1. Arrasta nó para canvas
2. Clica no nó para selecioná-lo
3. Painel direito exibe campo de texto
4. Digita mensagem que bot enviará
5. Preview aparece no nó automaticamente
```

### 4. Configurar Nó "Menu com Botões"
```
1. Arrasta nó para canvas
2. Seleciona nó
3. Preenche mensagem principal
4. Adiciona até 3 botões
5. Cada botão gera ponto de saída
6. Conecta saídas a outros nós
```

### 5. Configurar Nó "Ação de Integração"
```
1. Arrasta nó para canvas
2. Seleciona ação no dropdown
3. Define campo de entrada necessário
4. Conecta saída "Sucesso" a próximo nó
5. Conecta saída "Falha" a nó de erro
```

### 6. Configurar Nó "Transferir para Atendente"
```
1. Arrasta nó para canvas
2. Seleciona fila de atendimento
3. Nó fica configurado para transferência
4. Geralmente é nó final do fluxo
```

## 🔧 Estrutura de Dados

### Fluxo Salvo no Banco (flow_definition):
```json
{
  "nodes": [
    {
      "id": "sendMessage_1234567890",
      "type": "sendMessage",
      "position": { "x": 100, "y": 100 },
      "data": {
        "message": "Olá! Como posso ajudá-lo hoje?"
      }
    },
    {
      "id": "menuButtons_1234567891",
      "type": "menuButtons",
      "position": { "x": 300, "y": 100 },
      "data": {
        "message": "Escolha uma opção:",
        "buttons": ["Fatura", "Suporte", "Vendas"]
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "sendMessage_1234567890",
      "target": "menuButtons_1234567891",
      "markerEnd": { "type": "arrowclosed" }
    }
  ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

## 📊 Endpoints da API

### Fluxos (Protegidos - Admin Only)
- `GET /api/flows` - Listar fluxos
- `GET /api/flows/:id` - Obter fluxo específico
- `POST /api/flows` - Criar fluxo
- `PUT /api/flows/:id` - Atualizar fluxo
- `DELETE /api/flows/:id` - Excluir fluxo
- `POST /api/flows/:id/publish` - Publicar fluxo
- `POST /api/flows/:id/unpublish` - Despublicar fluxo
- `GET /api/flows/stats` - Estatísticas

### Público
- `GET /api/flows/active` - Obter fluxo ativo

### Respostas da API

#### Listar Fluxos
```json
{
  "message": "Fluxos listados com sucesso",
  "flows": [
    {
      "id": "flow_123",
      "name": "Fluxo Principal",
      "description": "Fluxo de boas-vindas",
      "flow_definition": { ... },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### Publicar Fluxo
```json
{
  "message": "Fluxo publicado com sucesso",
  "flow": {
    "id": "flow_123",
    "name": "Fluxo Principal",
    "is_active": true,
    ...
  }
}
```

#### Estatísticas
```json
{
  "message": "Estatísticas obtidas com sucesso",
  "stats": {
    "total": 5,
    "active": 1,
    "inactive": 4,
    "withDefinition": 3,
    "empty": 2
  }
}
```

## 🧪 Cenários de Teste

### 1. Criação de Fluxo
- ✅ Admin acessa /dashboard/flow-builder
- ✅ Arrasta 4 tipos de nós para canvas
- ✅ Conecta nós criando sequência
- ✅ Configura propriedades de cada nó
- ✅ Salva fluxo com nome único
- ✅ Publica fluxo ativando-o

### 2. Edição de Fluxo
- ✅ Fluxo ativo carregado automaticamente
- ✅ Modificações refletidas em tempo real
- ✅ Propriedades editáveis no painel direito
- ✅ Salvamento preserva estado completo

### 3. Validações
- ✅ Nome obrigatório para salvar
- ✅ Não permite nomes duplicados
- ✅ Não permite excluir fluxo ativo
- ✅ Não permite publicar fluxo vazio
- ✅ Apenas um fluxo ativo por vez

### 4. Interface e UX
- ✅ Drag & drop funcional
- ✅ Conexões visuais criadas corretamente
- ✅ Seleção de nós atualiza painel de propriedades
- ✅ Estados de loading durante operações
- ✅ Alertas de sucesso e erro

### 5. Controle de Acesso
- ✅ AGENT não acessa /dashboard/flow-builder
- ✅ Redirecionamento automático para dashboard
- ✅ Todas as rotas protegidas
- ✅ Endpoint público apenas para fluxo ativo

## 📝 Estrutura de Arquivos

### Backend
```
src/
├── controllers/
│   └── FlowController.ts        # Controlador principal
├── routes/
│   └── flows.ts                 # Rotas de fluxos
├── models/
│   └── ChatbotFlow.ts           # Modelo expandido
└── index.ts                     # Integração das rotas
```

### Frontend
```
src/
├── app/dashboard/
│   ├── page.tsx                 # Dashboard com link
│   └── flow-builder/
│       └── page.tsx             # Construtor visual
└── lib/
    └── api.ts                   # Cliente API expandido
```

## 🎯 Critérios de Aceite Atendidos

✅ **Acesso Restrito**: ADMIN acessa /dashboard/flow-builder, AGENT é bloqueado
✅ **Layout 3 Painéis**: Nós (esquerda), Canvas (centro), Propriedades (direita)
✅ **4 Tipos de Nós**: Enviar Mensagem, Menu com Botões, Ação de Integração, Transferir para Atendente
✅ **Arrastar e Soltar**: Nós do painel para canvas funcionais
✅ **Conectar Nós**: Criação de arestas entre nós
✅ **Configurar Propriedades**: Painel contextual para nó selecionado
✅ **Salvar Fluxo**: Persistência no banco de dados
✅ **Publicar Fluxo**: Ativação para uso pelos clientes
✅ **Carregar Fluxo**: Estado preservado ao recarregar página
✅ **JSON no Banco**: Estrutura salva corretamente em flow_definition

## 🏆 Resultado

O **Construtor Visual de Fluxo do Chatbot** está **100% funcional** e atende a todos os requisitos especificados no Prompt 05. A implementação oferece uma interface intuitiva e poderosa para criar fluxos de chatbot complexos.

### Funcionalidades Implementadas:
- ✅ Interface visual completa com React Flow
- ✅ 4 tipos de nós especializados
- ✅ Sistema de propriedades contextual
- ✅ Persistência robusta no banco de dados
- ✅ Controle de ativação de fluxos
- ✅ Validações e segurança completas
- ✅ API REST completa para gerenciamento
- ✅ Interface responsiva e moderna

### Próximos Passos:
Com o construtor implementado, a plataforma está pronta para:
- Executar fluxos criados no chatbot
- Processar interações dos usuários
- Integrar com APIs externas
- Transferir para atendentes humanos
- Coletar métricas e analytics

A base visual e lógica está sólida e permite que administradores criem experiências de chatbot sofisticadas sem necessidade de programação.


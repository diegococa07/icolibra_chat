# Prompt 09: Implementação do Perfil de Supervisor

**Feature**: Criação do Perfil de Supervisor com Gestão de Equipes e Visão de Dados Restrita.

## Descrição Detalhada

Neste prompt, foi introduzido um novo nível hierárquico, o **Supervisor**, que gerencia uma equipe específica de Atendentes e tem acesso apenas aos dados de sua equipe.

### 1. Alterações no Modelo de Dados

- **Nova Tabela `teams`**:
  - `id` (UUID, Chave Primária)
  - `name` (TEXT, Não Nulo)

- **Alterações na Tabela `users`**:
  - Adicionada a coluna `team_id` (UUID, Chave Estrangeira para `teams.id`, Nulável).
  - Atualizada a coluna `role` para aceitar o valor `SUPERVISOR`.

### 2. Lógica de Backend

- **Middlewares de Autorização**:
  - Atualizados para incluir o `SUPERVISOR`.
  - Criadas novas funções: `requireSupervisor`, `requireAdminOrSupervisor`.

- **Regra Crítica de Filtragem**:
  - Todas as consultas ao banco de dados feitas por um Supervisor são automaticamente filtradas para retornar apenas dados (conversas, mensagens, relatórios) associados aos usuários (Atendentes) que pertencem à sua `team_id`.

- **Novos Endpoints para Gestão de Equipes (Admin Only)**:
  - `GET /api/teams`: Lista todas as equipes.
  - `POST /api/teams`: Cria uma nova equipe.
  - `PUT /api/teams/:id`: Atualiza o nome de uma equipe.
  - `DELETE /api/teams/:id`: Exclui uma equipe.

### 3. Interface Visual (Frontend)

- **Para o Administrador**:
  - Criada uma nova página de **Gestão de Equipes** (`/dashboard/teams`) onde o Admin pode realizar o CRUD completo das equipes.
  - No formulário de criação/edição de usuários, foi adicionado um campo de seleção (dropdown) para associar um Atendente ou Supervisor a uma Equipe.

- **Para o Supervisor**:
  - O Supervisor faz login e vê um dashboard similar ao do Admin (listas de conversas, relatórios).
  - Toda a informação exibida (conversas na fila, dados nos relatórios) é restrita apenas aos membros de sua equipe.
  - O Supervisor tem permissão para visualizar as conversas de seus atendentes, mas não tem acesso às páginas de "Configurações" do sistema (Canais, Integração, etc.).


